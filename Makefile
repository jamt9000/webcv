all: shaderjs webcv

shaderjs:
	python ./scripts/shadersToJS.py ./shaders ./webcv-shadersource.js

webcv:
	python ./scripts/concatJS.py
