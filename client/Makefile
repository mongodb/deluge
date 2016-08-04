.PHONY: clean lint

../build/bundle.min.js: ../build/bundle.js
	./node_modules/.bin/uglifyjs -cm -o $@ --preamble "/* deluge $$(git describe) */" $^

../build/bundle.js: src/*.js node_modules
	flow
	./node_modules/.bin/rollup -c -o $@

lint:
	flow check

node_modules: package.json
	npm update

clean:
	rm -rf ../build/bundle.js ../build/bundle.min.js
