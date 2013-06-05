import cv2
import time

print cv2.__version__

cam = cv2.VideoCapture()
cv2.namedWindow("win")
cam.open(0)
cv2.startWindowThread()

fd = cv2.CascadeClassifier("./lbpcascade_frontalface.xml")

# frame = cv2.imread("./cam1.png")

while 1:
    start = time.time()
    ret, frame = cam.read()
    small = cv2.resize(frame, (320,240))
    rects = fd.detectMultiScale(small, 1.2, 0, 0, (24,24), (320,320))

    for r in rects:
        p1 = (r[0], r[1])
        p2 = (r[0]+r[2], r[1]+r[3])
        cv2.rectangle(small, p1, p2, (0,0,255))

    elapsed = time.time() - start
    print "Time " + str(elapsed * 1000.)

    cv2.imshow("win", small)

    key = cv2.waitKey(20)
    if key == ord('q'):
        break
