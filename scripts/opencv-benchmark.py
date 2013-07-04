import sys
import json
#sys.path = ["/home/james/Code/opencv-build/lib"] + sys.path
import cv2
import time
import numpy as np

print cv2.__version__

folddata = json.load(open('./folddata.txt'))

IMAGEDIR = "/home/james/Code/faceevaluation/facesInTheWild/"
cv2.namedWindow("win")
cv2.startWindowThread()


fd = cv2.CascadeClassifier("/home/james/Code/webcv/scripts/lbpcascade_frontalface.xml")

for fold in folddata:
    outfile = open(fold + "-out.txt", 'w')
    print fold
    for image in folddata[fold]:
        print image
        outfile.write(image + "\n")
        im = cv2.imread(IMAGEDIR + image + ".jpg")
        rawrects = fd.detectMultiScale(im, 1.2, 0, 0)
        rects, weights = cv2.groupRectangles(np.array(rawrects).tolist(), 1)
        print "nrects %d" % len(rects)
        outfile.write("%d\n" % len(rects))
        for i, r in enumerate(rects):
            weight = weights[i]
            rectline = "%f %f %f %f %d\n" % (r[0], r[1], r[2], r[3], weight)
            print rectline
            outfile.write(rectline)

            p1 = (r[0], r[1])
            p2 = (r[0]+r[2], r[1]+r[3])
            cv2.rectangle(im, p1, p2, (0,0,255))

            cv2.imshow("win", im)

    outfile.close()


