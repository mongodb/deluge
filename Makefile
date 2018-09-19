.PHONY: lint test clean

build/deluge.zip: application.py requirements.txt .ebextensions/*
	-rm $@
	zip -r $@ .ebextensions application.py requirements.txt

requirements.txt: Pipfile.lock
	pipenv lock --requirements > requirements.txt

lint:
	pipenv run flake8 --max-line-length=100 deluge/
	pipenv run mypy deluge/

test:
	pipenv run pytest

clean:
	-rm -f build/deluge.zip requirements.txt
