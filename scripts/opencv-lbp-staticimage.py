import sys
sys.path = ["/home/james/Code/opencv-build/lib"] + sys.path
import cv2
import time

print cv2.__version__

#cam = cv2.VideoCapture()
cv2.namedWindow("win")
#cam.open(0)
cv2.startWindowThread()

fd = cv2.CascadeClassifier("/home/james/Code/webcv/scripts/lbpcascade_frontalface.xml")

filename = sys.argv[1]
#frame = cv2.imread("/home/james/Code/webcv/demos/cvgrey.png")
#frame = cv2.imread("/home/james/Code/webcv/demos/newsradio.png")
#frame = cv2.imread("/home/james/Code/webcv/demos/scales.png")
frame = cv2.imread(filename)


start = time.time()

small = frame#cv2.resize(frame, (320,240))
rects = fd.detectMultiScale(small, 1.2, 0, 0, (24,24), (320,320))
elapsed = time.time() - start
print "Time " + str(elapsed * 1000.)
print rects

for r in rects:
    p1 = (r[0], r[1])
    p2 = (r[0]+r[2], r[1]+r[3])
    cv2.rectangle(small, p1, p2, (0,0,255))

cv2.imwrite(filename + ".rects.png", small)




cv2.imshow("win", small)
