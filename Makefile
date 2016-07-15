.PHONY: lint

deluge.zip: application.py requirements.txt .ebextensions/*
	rm $@
	zip -r $@ .ebextensions application.py requirements.txt

lint:
	pep8 --max-line-length=100 ./application.py
	mypy -s ./application.py
