from pylab import *
import cv2
from scipy.signal import convolve2d
from scipy.misc import imresize

gradx = array([[1,0,-1],[1,0,-1],[1,0,-1]])

cam = cv2.VideoCapture()
cv2.namedWindow("win")
cv2.namedWindow("debug")
cam.open(0)

def trackPoint(deriv_x, deriv_y, imdiff, point):
    px,py = point
    px = int(px)
    py = int(py)
    maxx = deriv_x.shape[1] - 1
    maxy = deriv_x.shape[0] - 1

    radius = 10

    for i in range(2):
        px_r = int(round(px))
        py_r = int(round(py))
        winPos = ogrid[max(0,py_r-radius):min(maxy,py_r+radius+1),max(0,px_r-radius):min(maxx,px_r+radius+1)]

        win_dx = deriv_x[winPos]
        cv2.imshow("debug", imresize(win_dx, (200,200)))
        win_dx = win_dx.flatten()

        win_dy = deriv_y[winPos].flatten()

        win_diff = imdiff[winPos]
        win_diff = win_diff.flatten()


        error_x = np.dot(win_dx, win_diff)
        error_y = np.dot(win_dy, win_diff)

        grad_xx = np.dot(win_dx, win_dx)
        grad_yy = np.dot(win_dy, win_dy)
        grad_xy = np.dot(win_dx, win_dy)

        G = np.array([[grad_xx, grad_xy],[grad_xy, grad_yy]])
        Ginv = pinv(G)

        displacement = Ginv * np.mat([[error_x],[error_y]])
        if sqrt(displacement.T * displacement) < 0.5:
            break
        px += displacement[1]
        py += displacement[0]

    return [int(px),int(py)]

def klt(im1, im2, points):
    deriv_x, deriv_y = np.gradient(im1) 
    imdiff = im1 - im2

    newpoints = []

    for p in points:
        d = trackPoint(deriv_x, deriv_y, imdiff, p)
        newpoints.append(d)


    return array(newpoints)


def webcamloop():
    ret, frame = cam.read()
    frame = frame[:,::-1,:]
    radius = 5
    maxx = frame.shape[1] - 1
    maxy = frame.shape[0] - 1

    grey = frame.mean(2)/255.0
    cv2.waitKey(20)

    points = [[300,200]]

    def updatePoints(event, x, y, thing1, points):
        if event == cv2.EVENT_LBUTTONDOWN:
            print points
            print x, y
            points.insert(0,[x,y])

    cv2.setMouseCallback("win", updatePoints, points)

    while 1:
        ret, frame2 = cam.read()
        frame2 = frame2[:,::-1,:]

        grey2 = frame2.mean(2)/255.


        newpoints = klt(grey, grey2, points)
        points[:] = []
        points.extend(newpoints)

        pointim = zeros(frame.shape)
        pointim[:,:,:] = grey[:,:,None]

        for p in points:
            px = int(p[0])
            py = int(p[1])
            winPos = ogrid[max(0,py-radius):min(maxy,py+radius+1),max(0,px-radius):min(maxx,px+radius+1)]
            pointim[winPos] = [0.,1.,0]

        cv2.imshow("win", pointim)

        frame = frame2
        grey = grey2


        
        key = cv2.waitKey(20)
        if key == ord('q'):
            break
