all: doc

doc:
	mddia -pdf notes.md | pandoc --bibliography ./Project.bib --csl=harvard-imperial-college-london.xml -o notes.pdf
	mddia notes.md | pandoc --bibliography ./Project.bib --csl=harvard-imperial-college-london.xml -o notes.html
