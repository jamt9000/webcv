%pylab
import cv2

im = imread("./cam1.png")
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



im2 = imread("./cam2.png")
grey2 = uint8((im2[:,:,0] + im2[:,:,1] + im2[:,:,2]) * 255)

integral2 = cv2.integral(grey2)

def deintegrate(integral, n):
    return (integral[n:,n:] - integral[0:-n,n:] - integral[n:,0:-n]) + integral[:-n,:-n]


"""
Bits for 320*240*255 = 24.2

Bits for (integralEvenCols - integralOddCols).max() = 15.3
"""
