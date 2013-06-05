import cv2
import time
import numpy as np

print cv2.__version__

cam = cv2.VideoCapture()
cam.open(0)

ret, frame = cam.read()
if ret == False:
    print "Cam capture failed"
    exit(1)
small = cv2.resize(frame, (320,240))
grey = np.uint8(small.mean(2))
t = int(time.time())
cv2.imwrite("captures/capture-%d-grey.png" % t, grey)
cv2.imwrite("captures/capture-%d-big.png" % t, frame)
