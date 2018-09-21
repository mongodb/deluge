#!/usr/bin/env python3
import datetime
import json
import logging
import os
import sys
import urllib.parse
from typing import Callable, Dict, Optional, Union

import pymongo
import werkzeug.serving
from werkzeug.wrappers import Request, Response
from werkzeug.exceptions import HTTPException, BadRequest, MethodNotAllowed

from .utils import anonymize_ip

logger = logging.getLogger(__name__)

FieldValueType = Union[bool, str, int, float]
EMPTY_BMP = b'BM\x1e\x00\x00\x00\x00\x00\x00\x00\x1a\x00\x00\x00\x0c\x00' \
            b'\x00\x00\x01\x00\x01\x00\x01\x00\x18\x00\x00\x00\xff\x00'


class Vote:
    MAX_KEY_LEN = 25
    MAX_PAGE_LEN = 255
    MAX_REASON_LEN = 1024

    def __init__(self,
                 page: str,
                 useful: bool,
                 fields: Dict[str, FieldValueType],
                 ip: Optional[str]) -> None:
        self.page = page
        self.useful = useful
        self.fields = fields

        self.ip = None
        if ip is not None:
            try:
                self.ip = anonymize_ip(ip)
            except ValueError:
                pass

    @classmethod
    def parse(cls, request: Request) -> 'Vote':
        ip = request.access_route[0] if len(request.access_route) > 0 else None

        try:
            parameters = cls.parse_qs(request.query_string)

            page = parameters['p']
            useful = parameters['v']

            if not isinstance(page, str):
                raise TypeError('Invalid page type')

            if not isinstance(useful, bool):
                raise TypeError('Invalid useful type')

            del parameters['p']
            del parameters['v']

            return cls(page[:cls.MAX_PAGE_LEN], useful, parameters, ip)
        except (KeyError, ValueError, TypeError) as err:
            logger.exception('Invalid vote request')
            raise ValueError('Invalid vote request') from err

    @classmethod
    def parse_qs(cls, query_string: bytes) -> Dict[str, FieldValueType]:
        parameters = urllib.parse.parse_qs(str(query_string, 'utf-8'))
        parsed = {}  # type: Dict[str, FieldValueType]
        for key, value in parameters.items():
            if len(key) > cls.MAX_KEY_LEN:
                raise ValueError('Key too long')

            value = json.loads(value[0][:cls.MAX_REASON_LEN])
            if not (isinstance(value, (str, bool, int, float))):
                raise TypeError('Invalid value type')

            parsed[key] = value

        return parsed


class Connection:
    """A database backend connection"""
    def __init__(self, connection_uri: str, votesSizeBytes: int) -> None:
        self.conn = pymongo.mongo_client.MongoClient(connection_uri, ssl=True)
        self.db = self.conn['deluge']

        try:
            self.db.create_collection('votes', capped=True, size=votesSizeBytes)
        except pymongo.errors.CollectionInvalid:
            pass

        self.votes = self.db['votes']
        self.votes.create_index('page')

    def vote(self, vote: Vote) -> None:
        """Record a vote for the given page path."""
        doc = {'page': vote.page,
               'useful': vote.useful,
               'ip': vote.ip,
               'date': datetime.datetime.utcnow()}
        for key, value in vote.fields.items():
            doc['q-{}'.format(key)] = value
        self.votes.save(doc)


class Deluge:
    """An HTTP frontent to Deluge."""
    def __init__(self, host: str) -> None:
        self.connection = Connection(host, 5*1024*1024*1024)

    @Request.application
    def application(self, request: Request) -> Union[Response, HTTPException]:
        """The Werkzeug WSGI request handler."""
        if request.method != 'GET':
            return MethodNotAllowed(valid_methods=('GET',))

        if request.path == '/health':
            return Response('')

        try:
            vote = Vote.parse(request)
        except ValueError:
            return BadRequest()

        self.connection.vote(vote)
        return Response(EMPTY_BMP, content_type='image/bmp')

    @classmethod
    def run(cls) -> Callable[[Request], Union[Response, HTTPException]]:
        """Create a Deluge instance and return the associated WSGI application
           using environment variables for configuration. Intended as an
           application entry point."""
        logging.basicConfig(level=logging.INFO)
        try:
            mongodb_host = os.environ['CONNECTION_STRING']
        except KeyError:
            logger.critical('Must specify CONNECTION_STRING in environment')
            sys.exit(1)

        logger.info('Connecting to %s', mongodb_host)
        return cls(mongodb_host).application


application = Deluge.run()


def main() -> None:
    werkzeug.serving.run_simple('localhost', 4000, application)
