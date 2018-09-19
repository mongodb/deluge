from typing import Iterable


class HTTPException(Exception): ...


class MethodNotAllowed(HTTPException):
    def __init__(self, valid_methods: Iterable[str]) -> None: ...


class BadRequest(HTTPException): ...
