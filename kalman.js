function kalman_update(estimate, covar, measurement, H, measureNoise) {
    // y = z - H*x
    var y = measurement.subtract(H.multiply(estimate));

    // residual covar S = H*P*H' + R
    var S = H.multiply(covar.multiply(H.transpose())).add(measureNoise)
    if(S === null) {
        console.log("S is null");
    }

    // Kalman gain
    // K = P*H'*S^-1
    if(S.cols() === 1 & S.rows() === 1) {
        // Handle case where S is a scalar
        var Sinv = $M([[1./S.elements[0][0]]]);
    } else {
        var Sinv = S.inverse();
    }
    if(Sinv === null) {
        console.log("Cannot invert S");
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
    // Example from Udacty course
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


// Create new array with default value
function replicate (n, x) {
  var xs = [];
  for (var i = 0; i < n; ++i) {
    xs.push (x);
  }
  return xs;
}

// dim = number of measured variables
//       (assume equal num hidden)
function Kalman(dim, estimate, covar) {
    if (!(this instanceof Kalman)) {
        throw new Error("Kalman must be instantiated with new");
    }
    if(dim === undefined) {
        dim = 2;
    }

    // initial estimate
    this.estimate = estimate || Matrix.Zero(dim * 2, 1);
    // initial covariance (uncertainty)
    this.covar = covar || Matrix.I(dim*2).multiply(1000);
    this.motion = Matrix.Zero(dim * 2, 1);
    // Measurement noise
    this.measureNoiseScalar = 2.0;
    this.measureNoise = Matrix.I(dim)
    // Motion noise
    this.motionNoiseScalar = 1.0;
    // Create array with diagonal 0,0,0,..1,1,1...
    this.motionNoise = Matrix.Diagonal(replicate(dim,0).concat(replicate(dim,1)));

    // F (next state) function
    /* eg for 2D
      this.F = $M([[1,0,1,0],
                   [0,1,0,1],
                   [0,0,1,0],
                   [0,0,0,1]]);
                 */
    var Ftop = Matrix.I(dim).augment(Matrix.I(dim));
    var Fbottom = Matrix.Zero(dim,dim).augment(Matrix.I(dim));
    this.F = Ftop.transpose().augment(Fbottom.transpose()).transpose();

    // H (measurement) function
    /* eg for 2D
       $M([[1,0,0,0],
          [0,1,0,0]]);*/
    this.H = Matrix.I(dim).augment(Matrix.Zero(dim,dim));
}

Kalman.prototype.filter = function(measurement) {
        

        var predict = kalman_predict(this.estimate, this.covar,
                this.motion, this.F, this.motionNoise.x(this.motionNoiseScalar));

        this.estimate = predict[0];
        this.covar = predict[1];

        // Only update if have measurement
        if (!this.missingMeasurement(measurement)) {
            var z = $M(measurement);

            var update = kalman_update(this.estimate, this.covar,
                          z, this.H, this.measureNoise.x(this.measureNoiseScalar));
            this.estimate = update[0];
            this.covar = update[1];
        }

        return [this.estimate, this.covar];
}

Kalman.prototype.predict = function() {
    return kalman_predict(this.estimate, this.covar,
                this.motion, this.F, this.motionNoise.x(this.motionNoiseScalar));
}

Kalman.prototype.update = function(measurement) {
    var z = $M(measurement);
    return kalman_update(this.estimate, this.covar,
                      z, this.H, this.measureNoise.x(this.measureNoiseScalar));
}


// Check if measurement has any undefined values
Kalman.prototype.missingMeasurement = function(m) {
    for(var i=0; i<m.length; i+=1) {
        if (m[i] === undefined) {
            return true;
        }
        return false;
    }
}


function kalman_test_2d() {
    var measurements = [[1,1],[2,2],[3,3]];

    var kal = new Kalman()


    for(var i=0; i<measurements.length; i++) {
        var res = kal.filter(measurements[i]);

        console.log('x=', res.predict[0].inspect());
        console.log('P=', res.predict[1].inspect());
    }
}
