#!/usr/bin/env python3.4
import datetime
import logging
import os
import sys
import urllib.parse
from typing import Callable, Union

import pymongo
import werkzeug.serving
from werkzeug.wrappers import Request, Response
from werkzeug.exceptions import HTTPException, BadRequest, MethodNotAllowed

logger = logging.getLogger(__name__)

EMPTY_BMP = b'BM\x1e\x00\x00\x00\x00\x00\x00\x00\x1a\x00\x00\x00\x0c\x00' \
            b'\x00\x00\x01\x00\x01\x00\x01\x00\x18\x00\x00\x00\xff\x00'


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

    def vote(self,
             page: str,
             useful: bool,
             reason: str) -> None:
        """Record a vote for the given page path."""
        self.votes.save({'page': page,
                         'useful': useful,
                         'date': datetime.datetime.utcnow(),
                         'reason': reason})


class Deluge:
    """An HTTP frontent to Deluge."""
    MAX_REQUESTS_PER_INTERVAL = 5

    def __init__(self, host: str) -> None:
        self.connection = Connection(host, 5*1024*1024*1024)

    @Request.application
    def application(self, request: Request) -> Union[Response, HTTPException]:
        """The Werkzeug WSGI request handler."""
        if request.method != 'GET':
            return MethodNotAllowed(valid_methods=('GET',))

        try:
            parameters = urllib.parse.parse_qs(str(request.query_string, 'utf-8'))
            page = parameters['p'][0]
            useful = bool(int(parameters['v'][0]) > 0)
            reason = parameters.get('r', [''])[0]
        except (KeyError, ValueError):
            return BadRequest()

        self.connection.vote(page, useful, reason)
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

if __name__ == '__main__':
    werkzeug.serving.run_simple('localhost', 4000, application)
