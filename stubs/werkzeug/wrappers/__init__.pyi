from typing import Callable, Sequence, Union
from werkzeug.exceptions import HTTPException


class Request:
    @property
    def method(self) -> str: ...

    @property
    def path(self) -> str: ...

    @property
    def query_string(self) -> bytes: ...

    @property
    def access_route(self) -> Sequence[str]: ...

    @staticmethod
    def application(f: Callable) -> Callable: ...


class Response:
    def __init__(self, response: Union[str, bytes], content_type: str='') -> None: ...
