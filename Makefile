.PHONY: all lint build/deluge.zip build/bundle.min.js clean

all: build/deluge.zip build/bundle.min.js

lint:
	$(MAKE) -C server/ lint
	$(MAKE) -C client/ lint

build/deluge.zip:
	$(MAKE) -C server/ ../build/deluge.zip

build/bundle.min.js:
	$(MAKE) -C client/ ../build/bundle.min.js

clean:
	$(MAKE) -C server/ clean
	$(MAKE) -C client/ clean

