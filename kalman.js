function kalman_update(estimate, covar, measurement, H, noise) {
    // y = z - H*x
    var y = measurement.subtract(H.multiply(estimate));

    // residual covar S = H*P*H' + R
    var S = H.multiply(covar.multiply(H.transpose())).add(noise)

    // Kalman gain
    // K = P*H'*S^-1
    if(S.cols() === 1 & S.rows() === 1) {
        // Handle case where S is a scalar
        var Sinv = $M([[1./S.elements[0][0]]]);
    } else {
        var Sinv = S.inverse();
    }
    var K = covar.multiply(H.transpose().multiply(Sinv));

    // new x = x + (K*y)
    var newEstimate = estimate.add(K.multiply(y));

    // new P = (I-K*H)*P
    var KH = K.multiply(H)
    var I = Matrix.I(KH.rows())
    var newCovar = (I.subtract(KH)).multiply(covar);

    return [newEstimate, newCovar];
}

function kalman_predict(estimate, covar, motion, F, motionNoise) {
    // new x = F * x + u
    var newEstimate = F.multiply(estimate).add(motion);
    // new P = F * P * F' + Q
    var newCovar = F.multiply(covar).multiply(F.transpose());
    if(motionNoise !== undefined) {
        newCovar = newCovar.add(motionNoise);
    }

    return [newEstimate, newCovar];
}

function kalman_test() {
    // Example from Udacity course
    // https://www.udacity.com/course/cs373

    var measurements = [1,2,3];

    //initial estimate
    var x = $M([[0],[0]]);
    //initial covar
    var P = $M([[1000,0],[0,1000]]);
    // motion
    var u = $M([[0],[0]]);
    // F (next state) function
    var F = $M([[1,1],[0,1]]);
    // H (measurement) function
    var H = $M([[1,0]]);
    // measurement noise
    var R = $M([[1]]);

    for(var i=0; i<measurements.length; i++) {
        var z = $M([[measurements[i]]]);

        update = kalman_update(x, P, z, H, R);
        x = update[0];
        P = update[1];

        predict = kalman_predict(x, P, u, F);
        x = predict[0];
        P = predict[1];

        console.log('x=', x.inspect());
        console.log('P=', P.inspect());

    }
}

function Kalman2D(estimate, covar) {
    if (!(this instanceof Kalman2D)) {
        throw new Error("Kalman2D must be instantiated with new");
    }

    // initial estimate
    this.estimate = estimate || $M([0,0,0,0]);
    // initial covariance (uncertainty)
    this.covar = covar || Matrix.I(4).multiply(1000);
    this.motion = $M([0,0,0,0]);
    // Measurement noise
    this.noiseScalar = 1.0;
    this.noise = $M([[1,1],[1,1]]);
    // Motion noise
    this.motionNoiseScalar = 1.0;
    this.motionNoise = Matrix.I(4);

    // F (next state) function
    this.F = $M([[1,0,1,0],
                [0,1,0,1],
                [0,0,1,0],
                [0,0,0,1]]);
    // H (measurement) function
    this.H = $M([[1,0,0,0],
                [0,1,0,0]]);
}

Kalman2D.prototype.filter = function(measurement) {
        var z = $M(measurement);
        var update = kalman_update(this.estimate, this.covar,
                      z, this.H, this.noise.x(this.noiseScalar));
        this.estimate = update[0];
        this.covar = update[1];

        var predict = kalman_predict(this.estimate, this.covar,
                this.motion, this.F, this.motionNoise.x(this.motionNoiseScalar));

        this.estimate = predict[0];
        this.covar = predict[1];

        return {update: update, predict: predict};
}

function kalman_test_2d() {
    var measurements = [[1,1],[2,2],[3,3]];

    var kal = new Kalman2D()


    for(var i=0; i<measurements.length; i++) {
        var res = kal.filter(measurements[i]);

        console.log('x=', res.predict[0].inspect());
        console.log('P=', res.predict[1].inspect());
    }
}
