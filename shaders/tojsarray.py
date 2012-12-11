#!/usr/bin/env python

import sys
import json

fname = sys.argv[1]

lines = open(fname).readlines()

def whitespace(s):
	return (s.strip() != "")

# Strip newlines and delete blank lines from input lines

stripped = filter(whitespace, map(str.rstrip, lines))

jstring = json.dumps(stripped, indent = 4)

# Strip trailing spaces from the finished string (JSLint doesn't like them)
jstring = "\n".join(map(str.rstrip, jstring.split('\n')))

print jstring
