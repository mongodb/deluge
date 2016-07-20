.PHONY: clean

bundle.min.js: bundle.js
	./node_modules/.bin/uglifyjs -cm -o $@ bundle.js

bundle.js: src/*.js node_modules
	flow
	./node_modules/.bin/rollup -c

node_modules: package.json
	npm update

clean:
	rm -f bundle.js bundle.min.js
