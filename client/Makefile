FLOW=./node_modules/.bin/flow

.PHONY: clean lint

../build/bundle.min.js: ../build/bundle.js
	./node_modules/.bin/uglifyjs -cm -o $@ $^

../build/bundle.js: src/*.js node_modules
	$(FLOW)
	./node_modules/.bin/rollup -c -o $@

lint:
	$(FLOW)

node_modules: package.json
	npm update

clean:
	rm -rf ../build/bundle.js ../build/bundle.min.js node_modules
