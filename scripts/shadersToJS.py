#!/usr/bin/env python

import sys
import json
import os


def fileLinesToArray(fname):
    lines = open(fname).readlines()

    def notblank(s):
        return (s.strip() != "")

    # Strip newlines and delete blank lines from input lines
    #stripped = filter(notblank, map(str.rstrip, lines)

    # keep newlines for debugging for now
    stripped = map(str.rstrip, lines)

    return stripped


def shadersToJSON(shaderdir):
    shaders = {"fragment": {}, "vertex": {}}

    for shaderType in ["fragment", "vertex"]:
        for f in [x for x in os.listdir(shaderdir) if x.endswith('.' + shaderType[0:4])]:
            fname = os.path.join(shaderdir, f)
            base = os.path.splitext(f)[0]
            shaders[shaderType][base] = fileLinesToArray(fname)

    jsonstr = json.dumps(shaders, indent=4)
    return jsonstr

if __name__ == "__main__":
    if len(sys.argv) > 1:
        jsstring = "WebCV.SHADERSOURCE = " + shadersToJSON(sys.argv[1])
    else:
        print "Usage: ./tojsarray.py <shader dir> [<output file>]"
        exit(1)

    if len(sys.argv) > 2:
        outfile = open(sys.argv[2], 'w')
        outfile.write(jsstring)
    else:
        print jsstring
