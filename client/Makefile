.PHONY: clean lint

../build/bundle.min.js: ../build/bundle.js
	./node_modules/.bin/uglifyjs -cm -o $@ $^

../build/bundle.js: src/*.js node_modules
	flow
	./node_modules/.bin/rollup -c -o $@

lint:
	flow

node_modules: package.json
	npm update

clean:
	rm -rf ../build/bundle.js ../build/bundle.min.js node_modules
