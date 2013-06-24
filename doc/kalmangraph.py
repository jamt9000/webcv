def f(mu, sigma2, x):
    return 1/sqrt(2.*pi*sigma2) * exp(-.5*(x-mu)**2 / sigma2)

def update(mu1, var1, mu2, var2):
    mu = (var2 * mu1 + var1 * mu2)/(var1 + var2)
    var = 1./((1./var1) + (1./var2))
    return [mu,var]

xx = arange(-5,10,.1)

muprior=1.
sigprior=8.
extmotion=4.
motionnoise=2.
measure=3.5
measurenoise=20.

prior = f(muprior, sigprior, xx)
pred = f(muprior+extmotion, sigprior+motionnoise, xx)
upd=update(muprior+extmotion,sigprior+motionnoise,measure,measurenoise)

post = f(upd[0], upd[1], xx)

ylim(ymax=0.3)

plot(xx,prior,label="Prior"); plot(xx,pred,'-.',label="Predicted"); plot(xx,post,'--',label="Posterior");plot(measure, 0.008, 'v', ms=15., label="Measurement")

legend(loc=2)

