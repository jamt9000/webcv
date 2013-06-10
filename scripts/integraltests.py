#%pylab
import cv2
from pylab import *

im = imread("../demos/library.png")
grey = uint8((im[:,:,0] + im[:,:,1] + im[:,:,2]) * 255)

integral = cv2.integral(grey)

indexmularray = int32(zeros(integral.shape))


for r in range(integral.shape[0]):
    for c in range(integral.shape[1]):
        indexmularray[r,c] = r*c*140


integralEvenCols = integral[:, 0::2][:,1:]
integralOddCols = integral[:, 1::2]


greySmall = grey[:120, :160]
indexmularraySmall = indexmularray[:121, :161]
integralSmall = cv2.integral(greySmall)
integralSmallEvenCols = integral[:, 0::2][:,1:]
integralSmallOddCols = integral[:, 1::2]



im2 = imread("../demos/libraryflip.png")
grey2 = uint8((im2[:,:,0] + im2[:,:,1] + im2[:,:,2]) * 255)

integral2 = cv2.integral(grey2)

def deintegrate(integral, n):
    return (integral[n:,n:] - integral[0:-n,n:] - integral[n:,0:-n]) + integral[:-n,:-n]

def verticalPass(image):
    h = image.shape[0]
    w = image.shape[1]
    out = zeros((h+1,w+1))
    template = zeros((h+1,w+1))
    template[1:,1:] = image
    for col in range(h):
        out += template
        # Slide template down
        template = roll(template, 1, axis=0)
        template[0] = 0
    return out

def horizontalPass(vertImage):
    out = zeros(vertImage.shape)
    template = array(vertImage)

    for col in range(vertImage.shape[1]):
        out += template
        # Slide template right
        template = roll(template, 1, axis=1)
        template[:,0] = 0
    return out

def testIntegral(im=grey):
    integral_2pass = horizontalPass(verticalPass(im))
    return integral_2pass == cv2.integral(grey)





"""
Bits for 320*240*255 = 24.2

Bits for (integralEvenCols - integralOddCols).max() = 15.3
"""
