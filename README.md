[![Build Status](https://travis-ci.org/i80and/deluge.svg?branch=master)](https://travis-ci.org/i80and/deluge)

Deluge
======

A simple web feedback server.

## Local Development

Install all development dependencies:
```shell
pipenv install --dev
```

Ensure you are running a local `mongod` instance on default port 27017. To run the Deluge server:
```shell
CONNECTION_STRING="mongodb://localhost:27017" pipenv run python3 -m deluge
```

You can now make requests to the server at `http://localhost:4000`.

### Troubleshooting
If starting the server fails, ensure that `ssl=False` in `deluge/application.py` for development purposes.

## Linting

To lint before pushing changes to GitHub:
```shell
make lint test
```
