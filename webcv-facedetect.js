var showImage = false;

var FaceDetector = function (cascade, width, height) {
    if (!(this instanceof FaceDetector)) {
        throw new Error("FaceDetector must be instantiated with new");
    }

    this.cascade = cascade;

    this.scaleFactor = 1.2;
    this.windowSize = 24;

    // Dimensions of image detector will run on
    this.width = width;
    this.height = height;

    // Integral image dims always one greater
    this.integralWidth = width + 1;
    this.integralHeight = height + 1;

    this.lbpLookupTableSize = this.calculateLBPLookupTableSize();

    this.lbpLookupTexture = this.createLBPLookupTexture();

    // Output textures for pingponging
    this.outTexture1 = cv.gpu.blankTexture(this.integralWidth, this.integralHeight,
                 {format: gl.RGBA, type: gl.UNSIGNED_BYTE, flip: false});
    this.outTexture2 = cv.gpu.blankTexture(this.integralWidth, this.integralHeight,
                 {format: gl.RGBA, type: gl.UNSIGNED_BYTE, flip: false});

    this.fb = gl.createFramebuffer();

    this.lbpShaders = this.setupShaders();

    this.pixels = new Uint8Array(this.integralWidth * this.integralHeight * 4);
}

FaceDetector.prototype.detect = function (image) {
    var w = this.width,
        h = this.height,
        iw = this.integralWidth,
        ih = this.integralHeight,
        cascade = this.cascade;

    // Convert to grayscale
    var grey = cv.imgproc.imageToGreyArray(image);

    // Create and upload integral image
    var integral = new Float32Array(iw * ih);
    cv.imgproc.integralImage(grey, this.width, this.height, integral);
    var integralTexture = cv.gpu.uploadArrayToTexture(integral, null, iw, ih, 
                       {format: gl.LUMINANCE, filter: gl.NEAREST, type: gl.FLOAT, flip: false});

    // Bind textures for the integral image and LBP lookup table
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, integralTexture);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.lbpLookupTexture);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);



    var outTextures = [this.outTexture1, this.outTexture2];

    var nstages = cascade.stages.length;
    var scaleN = 0;

    var timeStart = new Date();
    var rectangles = []

    for (scale = 1.0; scale * this.windowSize < w && scale * this.windowSize < h; scale *= this.scaleFactor) {
        var scaledWindowSize = Math.round(scale * this.windowSize);
        var drawWidth = this.integralWidth - scaledWindowSize;
        var drawHeight = this.integralHeight - scaledWindowSize;
        var readWidth = drawWidth;
        var readHeight = drawHeight;
        if(showImage) {
            readWidth = iw;
            readHeight = ih;
        }

        console.log(drawWidth, drawHeight);
        gl.viewport(0, 0, drawWidth, drawHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);



        for (stageN = 0; stageN < nstages; stageN += 1) {
            var outTexture = outTextures[stageN % 2];
            var activeWindowTexture = outTextures[(stageN + 1) % 2];

            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outTexture, 0);
            gl.clearColor(0,1,0,1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.useProgram(this.lbpShaders[stageN]);
            cv.shaders.setUniforms(this.lbpShaders[stageN], {"scale": scale});

            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, activeWindowTexture);

            //XXX
            if (showImage && stageN === 0) {
                gl.drawArrays(gl.TRIANGLES, 0, 6);
                break;
            }

            gl.drawArrays(gl.TRIANGLES, 0, 6);

        }
        gl.readPixels(0, 0, readWidth, readHeight, gl.RGBA, gl.UNSIGNED_BYTE, this.pixels);


        cv.utils.showRGBA(this.pixels, readWidth, readHeight);

        // Gather the rectangles from the image
        var k, x, y;
        for (k = 0; k < drawWidth * drawHeight; k += 1) {
            if (this.pixels[k * 4] == 255) {
                x = (k) % drawWidth;
                y = Math.floor((k) / drawWidth);
                rectangles.push([x, y, scaledWindowSize, scaledWindowSize]);
            }
        }
        //XXX
        if (scaleN == 8) {
            break;
        }

        scaleN += 1;
    }
    console.log(new Date() - timeStart);
    return rectangles;
}

FaceDetector.prototype.setupShaders = function () {
    var shaderArray = [],
        cascade = this.cascade,
        w = this.width,
        h = this.height,
        iw = this.integralWidth,
        ih = this.integralHeight,
        vertexAttributes,
        lbpShader,
        nstages = cascade.stages.length,
        nweak,
        s,
        k,
        stage,
        uniforms;

    // A simple rectangle (2 triangles)
    var vertCoords = new Float32Array([
        0.0,   0.0,
        iw, 0.0,
        0.0,   ih,
        0.0,   ih,
        iw, 0.0,
        iw, ih]);

    var vertBuf = cv.shaders.arrayBuffer(vertCoords);

    for (s = 0; s < nstages; s += 1) {
        stage = cascade.stages[s];
        nweak = stage.weakClassifiers.length;
        
        var defs = {"STAGEN": s,
                    "NWEAK": nweak};

        if (showImage) {
            defs["DEBUG_SHOWIMG"] = 1;
        }

        lbpShader = cv.shaders.getNamedShader("lbpStage", {"defines": defs});
        gl.useProgram(lbpShader);

        uniforms = {
            "uResolution": [iw, ih],
            "uImageSize": [iw, ih],
            "stageThreshold": stage.stageThreshold,
            "leafValues": [],
            "featureRectangles": [],
            "lbpLookupTableSize": this.lbpLookupTableSize,
            "uSampler": 0,
            "lbpLookupTexture": 1,
            "scale": 1.0,
            "activeWindows": 2
        };

        for (k = 0; k < nweak; k += 1) {
            uniforms.leafValues = uniforms.leafValues.concat(stage.weakClassifiers[k].leafValues);
            uniforms.featureRectangles = uniforms.featureRectangles.concat(stage.weakClassifiers[k].featureRectangle);
        }

        cv.shaders.setUniforms(lbpShader, uniforms);

        cv.shaders.setAttributes(lbpShader, {aPosition: vertBuf});

        shaderArray.push(lbpShader);
    }

    return shaderArray;
}

FaceDetector.prototype.calculateLBPLookupTableSize = function() {
    var cascade = this.cascade,
        stages = cascade.stages,
        nstages = stages.length,
        maxWeakClassifiers = 0,
        nweak,
        k,
        texWidth,
        texHeight,
        lbpArrangements = 256;

    // Find max number of weak classifiers (for width of texture)
    for (k = 0; k < stages.length; k += 1) {
        nweak = stages[k].weakClassifiers.length;
        maxWeakClassifiers = nweak > maxWeakClassifiers ? nweak : maxWeakClassifiers;
    }

    texWidth = maxWeakClassifiers * lbpArrangements;
    texHeight = nstages;

    return [texWidth, texHeight];
}

/**
 * The pertinent LBP values for each weak classifier are stored packed as the bits
 * in 8 x 32 bit integers. For easier access by the shader program, this function
 * transforms them into a texture representation, with a row for each stage, and
 * a column of 256 bytes for each weak classifier, such that 0 or 255 byte value
 * indicates if the LBP value with that index is relevant.
 */

FaceDetector.prototype.createLBPLookupTexture = function () {
    var maxWeakClassifiers = 0,
        cascade = this.cascade,
        stages = cascade.stages,
        nstages = stages.length,
        lbpArrangements = 256,
        dim = this.lbpLookupTableSize,
        texWidth = dim[0],
        texHeight = dim[1],
        k,
        w,
        lbpMapArray,
        bitvec,
        lbpVal,
        bit;

    lbpMapArray = new Uint8Array(texWidth * texHeight);

    for (k = 0; k < nstages; k += 1) {
        for (w = 0; w < stages[k].weakClassifiers.length; w += 1) {
            bitvec = stages[k].weakClassifiers[w].categoryBitVector;
            for (lbpVal = 0; lbpVal < lbpArrangements; lbpVal += 1) {
                bit = Boolean(bitvec[lbpVal >> 5] & (1 << (lbpVal & 31)));
                lbpMapArray[(w * lbpArrangements + lbpVal) + k * texWidth] = bit * 255;
            }
        }
    }

    return cv.gpu.uploadArrayToTexture(lbpMapArray, null, texWidth, texHeight,
             {filter: gl.NEAREST, format: gl.LUMINANCE,
              type: gl.UNSIGNED_BYTE, flip: false});
}
