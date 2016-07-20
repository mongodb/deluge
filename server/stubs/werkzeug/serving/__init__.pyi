from typing import Callable, Union
from werkzeug.wrappers import Request, Response
from werkzeug.exceptions import HTTPException

def run_simple(host: str, port: int, app: Callable[[Request], Union[HTTPException, Response]]) -> None: ...
