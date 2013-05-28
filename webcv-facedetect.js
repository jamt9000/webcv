var showImage = false;

var FaceDetector = function (cascade, width, height) {
    if (!(this instanceof FaceDetector)) {
        throw new Error("FaceDetector must be instantiated with new");
    }

    var setupStart = new Date();

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

    // Output textures and framebuffers for pingponging
    var framebuffer1 = gl.createFramebuffer();
    var framebuffer2 = gl.createFramebuffer();
    this.finalFramebuffer = gl.createFramebuffer();
    this.framebuffers = [framebuffer1, framebuffer2];

    var outTexture1 = cv.gpu.blankTexture(this.integralWidth, this.integralHeight,
                 {format: gl.RGBA, type: gl.UNSIGNED_BYTE, flip: false});
    var outTexture2 = cv.gpu.blankTexture(this.integralWidth, this.integralHeight,
                 {format: gl.RGBA, type: gl.UNSIGNED_BYTE, flip: false});
    this.finalTexture = cv.gpu.blankTexture(this.integralWidth, this.integralHeight,
                 {format: gl.RGBA, type: gl.UNSIGNED_BYTE, flip: false});
    this.outTextures = [outTexture1, outTexture2];


    // Attach textures to framebuffers (turns out doing this before
    // setupShaders() makes the first draw/readPixels a lot faster)
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer1);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outTexture1, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer2);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outTexture2, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.finalFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D, this.finalTexture, 0);


    // Compile the code for all the shaders (one for each stage)
    this.lbpShaders = this.setupShaders();

    this.integral = new Float32Array(this.integralWidth * this.integralHeight);
    this.integralTexture = cv.gpu.blankTexture(this.integralWidth,
            this.integralHeight, {format: gl.LUMINANCE, filter: gl.NEAREST,
                type: gl.FLOAT, flip: false});

    this.pixels = new Uint8Array(this.integralWidth * this.integralHeight * 4);
    console.log("Setup time", new Date() - setupStart);
}

FaceDetector.prototype.detect = function (image) {
    var w = this.width,
        h = this.height,
        iw = this.integralWidth,
        ih = this.integralHeight,
        cascade = this.cascade;

    if (window.times === undefined) {
        window.times = [];
    }


    // Convert to grayscale
    var grey = cv.imgproc.imageToGreyArray(image);

    // Create and upload integral image
    cv.imgproc.integralImage(grey, this.width, this.height, this.integral);
    gl.bindTexture(gl.TEXTURE_2D, this.integralTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, iw, ih, 0, gl.LUMINANCE,
            gl.FLOAT, this.integral);

    // Bind textures for the integral image and LBP lookup table
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.integralTexture);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.lbpLookupTexture);

    var nstages = cascade.stages.length;

    var timeStart = new Date();
    var rectangles = []

    var ndraws = 0;
    var readTime = 0.0;

    // Ordinal number of the scale, which will be written as the output pixel
    // value when a rectangle is detected at a certain scale
    var scaleN = 1;

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Clear final output framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.finalFramebuffer);
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (scale = 1.0; scale * this.windowSize < w && scale * this.windowSize < h; scale *= this.scaleFactor) {
        var scaleTime = new Date();
        var scaledWindowSize = Math.round(scale * this.windowSize);
        var drawWidth = this.integralWidth - scaledWindowSize;
        var drawHeight = this.integralHeight - scaledWindowSize;

        gl.viewport(0, 0, drawWidth, drawHeight);
        gl.disable(gl.BLEND);

        for (stageN = 0; stageN < nstages; stageN += 1) {
            var drawTime = new Date();

            // Render to the framebuffer holding one texture, while using the
            // other texture, containing windows still active from the previous
            // stage as input
            var outFramebuffer = this.framebuffers[stageN % 2];
            gl.bindFramebuffer(gl.FRAMEBUFFER, outFramebuffer);
            var activeWindowTexture = this.outTextures[(stageN + 1) % 2];

            gl.clearColor(0,1,0,1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            if(stageN == nstages-1) {
                // On last stage render to final out texture
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.finalFramebuffer);
                gl.enable(gl.BLEND);
            }


            // Bind the texture of windows still active (potentially faces) to
            // texture unit 2
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, activeWindowTexture);


            gl.useProgram(this.lbpShaders[stageN]);
            cv.shaders.setUniforms(this.lbpShaders[stageN], {"scale": scale, "scaleN": scaleN});


            if (showImage && stageN === 0) {
                gl.drawArrays(gl.TRIANGLES, 0, 6);
                break;
            }

            gl.drawArrays(gl.TRIANGLES, 0, 6);
            ndraws += 1;
        }

        //gl.readPixels(0, 0, iw, ih, gl.RGBA, gl.UNSIGNED_BYTE, this.pixels);
        //cv.utils.showRGBA(this.pixels, iw, ih);
        console.log("Scale", scale, "time", new Date() - scaleTime, "readPixels time", readTime);

        scaleN += 1;
    }

    // Gather the rectangles from the image
    gl.readPixels(0, 0, iw, ih, gl.RGBA, gl.UNSIGNED_BYTE, this.pixels);
    //cv.utils.showRGBA(this.pixels, iw, ih);
    var k, x, y, pixelValue, scaleBy;
    for (k = 0; k < iw * ih; k += 1) {
        // Scale number stored as pixel value
        pixelValue = this.pixels[k * 4];
        if (pixelValue != 0) {
            scaleBy = Math.pow(this.scaleFactor, pixelValue-1);
            x = (k) % iw;
            y = Math.floor((k) / iw);
            rectangles.push([x, y, this.windowSize * scaleBy, this.windowSize * scaleBy]);
        }
    }

    console.log("number of draw calls:", ndraws);
    var overallTime = new Date() - timeStart;
    console.log("Overall time:", overallTime);
    window.times.push(overallTime);
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
