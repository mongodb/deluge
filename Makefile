.PHONY: lint clean

build/deluge.zip: application.py requirements.txt .ebextensions/*
	rm $@ || true
	zip -r $@ .ebextensions application.py requirements.txt

lint:
	pep8 --max-line-length=100 ./application.py
	MYPYPATH=stubs mypy --check-untyped-defs --strict-optional ./application.py

clean:
	rm -f build/deluge.zip
