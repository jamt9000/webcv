def f(mu, sigma2, x):
    return 1/sqrt(2.*pi*sigma2) * exp(-.5*(x-mu)**2 / sigma2)

def update(mu1, var1, mu2, var2):
    mu = (var2 * mu1 + var1 * mu2)/(var1 + var2)
    var = 1./((1./var1) + (1./var2))
    return [mu,var]

def predict(mu1, var1, mu2, var2):
    mu = mu1 + mu2
    var = var1 + var2
    return [mu,var]


measurements = [5., 6., 7., 9., 10.]
motion = [1., 1., 2., 1., 1.]
measurement_sig = 4.
motion_sig = 2.
mu = 0
sig = 10000


for i in range(len(measurements)):
    [mu,sig] = update(mu, sig, measurements[i], measurement_sig)
    [mu,sig] = predict(mu,sig, motion[i], motion_sig)

def filter(x, P):
    for n in range(len(measurements)):
        z = measurements[n]

        # measurement update
        y = z - H * x
        S = H * P * H.transpose() + R
        K = P * H.transpose() * S.inverse()
        x = x + K*y
        P = (I - K*H) * P
        
        # prediction
        x = F*x + u
        P = F*P*F.transpose()
        
        print 'x= '
        x.show()
        print 'P= '
        P.show()
