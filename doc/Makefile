all: doc

doc: pdf html

pdf:
	mddia -pdf notes.md | pandoc --bibliography ./Project.bib --csl=harvard-imperial-college-london.xml -o notes.pdf

html:
	mddia notes.md | pandoc --bibliography ./Project.bib --csl=harvard-imperial-college-london.xml -o notes.html
