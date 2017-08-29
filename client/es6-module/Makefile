SVELTE=./node_modules/.bin/svelte

.PHONY: build clean

build: node_modules/.CURRENT
	-rm -r src
	mkdir -p src/components
	$(SVELTE) compile -o src/components/BinaryQuestion.js ../src/components/BinaryQuestion.html
	$(SVELTE) compile -o src/components/FreeformQuestion.js ../src/components/FreeformQuestion.html
	$(SVELTE) compile -o src/components/MainWidget.js ../src/components/MainWidget.html
	cp ../src/lib.js src/lib.js
	sed -i '' -e "s/\.html';/\.js';/" ./src/components/*.js ./src/*.js

node_modules/.CURRENT: package.json
	npm install
	touch node_modules/.CURRENT

clean:
	-rm -r src
