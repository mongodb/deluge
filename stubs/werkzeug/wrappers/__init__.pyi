from typing import Any, Union
from werkzeug.exceptions import HTTPException


class Request:
    @property
    def method(self) -> str: ...

    @property
    def query_string(self) -> bytes: ...

    @staticmethod
    def application(f: Any): ...

class Response:
    def __init__(self, response: Union[str, bytes], content_type: str='') -> None: ...
