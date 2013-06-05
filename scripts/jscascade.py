#!/usr/bin/env python

import xmltodict
import json
import sys
import os

def cascadeParse(fname):
    xmlString = open(fname).read()
    cascadeDict = xmltodict.parse(xmlString)

    root = cascadeDict['opencv_storage']['cascade']

    features = [map(int, x['rect'].split()) for x in root['features']['_']]

    stages = []

    for s in root['stages']['_']:
        """
        <maxWeakCount>3</maxWeakCount>
        <stageThreshold>-0.7520892024040222</stageThreshold>
        <weakClassifiers>
        ...
        <weakClassifiers>
        """
        stage = {}
        stage["maxWeakCount"] = int(s['maxWeakCount'])
        stage["stageThreshold"] = float(s['stageThreshold'])
        stage["weakClassifiers"] = []

        for w in s["weakClassifiers"]['_']:
            weakClassifier = {}

            # internalNodes is OpenCV's somewhat obfuscated representation of the categorical tree node
            # containing [leftChildIndex, rightChildIndex, featureIndex, 8 x int32] where the int32s 
            # are in fact a bit vector representation of the categories (LBP configurations)
            # Since we are dealing with stumps we do not care about the left/right child

            internalNodes = w["internalNodes"].split()
            weakClassifier["featureIndex"] = int(internalNodes[2])
            weakClassifier["featureRectangle"] = features[weakClassifier["featureIndex"]]
            weakClassifier["categoryBitVector"] = map(int, internalNodes[3:])
            weakClassifier["leafValues"] = map(float, w["leafValues"].split())
            stage["weakClassifiers"].append(weakClassifier)

        stages.append(stage)

    cascade = { 
                "stages": stages,
                "height": root['height'],
                "width": root['width']
              }

    return cascade

def formatJS(name, cascade):  
  js = "var " + name + " = " + json.dumps(cascade, indent=4)
  return js

def convertCascadeToJS(fname):
   fname = sys.argv[1]
   base = os.path.basename(fname)
   name = os.path.splitext(base)[0]

   js = formatJS(name, cascadeParse(fname))

   f = open(name + ".js", "w+")
   f.write(js)
  

if __name__ == "__main__":
  convertCascadeToJS(sys.argv[1])
