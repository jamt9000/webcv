var showImage = false;
var timeStage = false;
var drawStages = false;
var zCull = false;
var stencilCull = false;
var wantColourBuffer = true;
var THRESHOLD_EPS = 1e-5;

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

    // Determine number of stages and scales for cascade
    this.nstages = cascade.stages.length;
    this.nscales = 0;

    for (var scale = 1.0;
            (scale * this.windowSize < this.width) && 
            (scale * this.windowSize < this.height);
            scale *= this.scaleFactor) {
                this.nscales += 1;
            }

    // Array to time stages and scales
    // Width: nscales, Height: nstages
    this.stageTimes = [];
    for(var i=0; i<this.nstages; i++) {
        var a = [];
        for(var j=0; j<this.nscales; j++) {
            a.push(0);
        }
        this.stageTimes.push(a);
    }


    this.lbpLookupTableSize = this.calculateLBPLookupTableSize();

    this.lbpLookupTexture = this.createLBPLookupTexture();

    // Output textures and framebuffers for pingponging
    var framebuffer1 = gl.createFramebuffer();
    var framebuffer2 = gl.createFramebuffer();
    this.finalFramebuffer = gl.createFramebuffer();
    this.framebuffers = [framebuffer1, framebuffer2];

    if(wantColourBuffer || drawStages || (!zCull && !stencilCull)) {
        var outTexture1 = cv.gpu.blankTexture(this.width, this.height,
                {format: gl.RGBA, type: gl.UNSIGNED_BYTE, flip: false});
        var outTexture2 = cv.gpu.blankTexture(this.width, this.height,
                {format: gl.RGBA, type: gl.UNSIGNED_BYTE, flip: false});
        this.outTextures = [outTexture1, outTexture2];
    }
    this.finalTexture = cv.gpu.blankTexture(this.width, this.height,
                 {format: gl.RGBA, type: gl.UNSIGNED_BYTE, flip: false});
    this.originalImageTexture = cv.gpu.blankTexture(this.width, this.height,
                 {format: gl.RGBA, type: gl.UNSIGNED_BYTE, flip: false});

    // Create buffer for depth
    if(zCull) {
        //this.depthTexture1 = cv.gpu.blankTexture(this.integralWidth, this.integralHeight,
        //             {format: gl.DEPTH_COMPONENT, type: gl.UNSIGNED_SHORT, flip: false});
        this.depthBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
    }

    if(stencilCull) {
        this.stencilBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.stencilBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.STENCIL_INDEX8, this.width, this.height);
    }


    // Attach textures to framebuffers (turns out doing this before
    // setupShaders() makes the first draw/readPixels a lot faster)
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer1);
    if(zCull) {
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);
    }
    
    if (stencilCull) {
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.RENDERBUFFER, this.stencilBuffer);
    }
    
    if(wantColourBuffer || drawStages || (!zCull && !stencilCull)) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outTexture1, 0);
    }
    

    if(!zCull && !stencilCull) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer2);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outTexture2, 0);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.finalFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D, this.finalTexture, 0);
    if(zCull) {
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);
    } 
    
    if(stencilCull) {
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.RENDERBUFFER, this.stencilBuffer);
    }


    // Compile the code for all the shaders (one for each stage)
    this.vertBuf = undefined; // Keep track of vertex buffer for quad. Set in setupShaders
    this.lbpShaders = this.setupShaders();

    this.integral = new Float32Array(this.integralWidth * this.integralHeight);
    this.integralTexture = cv.gpu.blankTexture(this.integralWidth,
            this.integralHeight, {format: gl.LUMINANCE, filter: gl.NEAREST,
                type: gl.FLOAT, flip: false});

    this.pixels = new Uint8Array(this.width * this.height * 4);
    this.greyImage = new Uint8Array(this.width * this.height);
    console.log("Setup time", new Date() - setupStart);

}


FaceDetector.prototype.detect = function (image) {
    var totalTimeStart = new Date();
    var cascade = this.cascade;

    if (window.times === undefined) {
        window.times = [];
    }

    if(zCull) {
        gl.enable(gl.DEPTH_TEST);
    }
    
    if(stencilCull) {
        gl.enable(gl.STENCIL_TEST);
        // Check if < 1
        gl.stencilFunc(gl.LESS, 1, 0xff);
        // If fail write 0
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.ZERO);
    }

    // Upload original image
    gl.bindTexture(gl.TEXTURE_2D, this.originalImageTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    // Convert to grayscale
    var greyStart = new Date();
    var grey = cv.imgproc.imageToGreyArray(image, this.greyImage, this.width, this.height);
    console.log("Grayscale time", new Date() - greyStart);

    // Create and upload integral image
    var integralStart = new Date();
    cv.imgproc.integralImage(grey, this.width, this.height, this.integral);
    console.log("Integral time", new Date() - integralStart);
    gl.bindTexture(gl.TEXTURE_2D, this.integralTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, this.integralWidth, this.integralHeight, 0, gl.LUMINANCE,
            gl.FLOAT, this.integral);

    // Bind textures for the integral image and LBP lookup table
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.integralTexture);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.lbpLookupTexture);


    var detectTimeStart = new Date();
    var rectangles = []

    var ndraws = 0;

    // Ordinal number of the scale, which will be written as the output pixel
    // value when a rectangle is detected at a certain scale
    var scaleN = 1;

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Clear final output framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.finalFramebuffer);
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var scale = 1.0;

    for (var s=0; s<this.nscales; s++) {
        var scaleTime = new Date();
        var scaledWindowSize = Math.round(scale * this.windowSize);
        var drawWidth = this.width - scaledWindowSize;
        var drawHeight = this.height - scaledWindowSize;

        gl.viewport(0, 0, drawWidth, drawHeight);
        gl.disable(gl.BLEND);


        if(zCull) {
            // Clear depthbuffer
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[0]);
            gl.clearDepth(1.0);
            gl.clear(gl.DEPTH_BUFFER_BIT);
            //gl.colorMask(false,false,false,false);
        }
        
        if(stencilCull) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[0]);
            gl.clearStencil(1);
            gl.clear(gl.STENCIL_BUFFER_BIT);
        }


        for (stageN = 0; stageN < this.nstages; stageN += 1) {

            // Render to the framebuffer holding one texture, while using the
            // other texture, containing windows still active from the previous
            // stage as input
            var outFramebuffer = this.framebuffers[stageN % 2];
            if(zCull || stencilCull) {
                outFramebuffer = this.framebuffers[0];
            }
            gl.bindFramebuffer(gl.FRAMEBUFFER, outFramebuffer);

            gl.clearColor(0,0,0,0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            if(stageN == this.nstages-1) {
                // On last stage render to final out texture
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.finalFramebuffer);
                if(zCull || stencilCull) { 
                    //gl.colorMask(true,true,true,true);
                } else {
                    gl.enable(gl.BLEND);
                }
            }


            // Bind the texture of windows still active (potentially faces) to
            // texture unit 2
            if(!zCull && !stencilCull) {
                var activeWindowTexture = this.outTextures[(stageN + 1) % 2];
                gl.activeTexture(gl.TEXTURE2);
                gl.bindTexture(gl.TEXTURE_2D, activeWindowTexture);
            }


            gl.useProgram(this.lbpShaders[stageN]);
            cv.shaders.setUniforms(this.lbpShaders[stageN], {"scale": scale, "scaleN": scaleN});
            cv.shaders.setAttributes(this.lbpShaders[stageN], {aPosition: this.vertBuf});


            if (showImage && stageN === 0) {
                gl.drawArrays(gl.TRIANGLES, 0, 6);
                break;
            }
            

            if(timeStage) {
                // Do the draw many times and take average
                var niters = 10;
                var drawStart = new Date();
                for(var n=0; n<niters; n++) {
                    gl.drawArrays(gl.TRIANGLES, 0, 6);
                    ndraws += 1;
                    // Dummy readPixels to wait until gpu finishes
                    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.pixels);
                }
                var drawTime = new Date() - drawStart;
                drawTime /= niters;
                this.stageTimes[stageN][s] = drawTime;
            } else {
                gl.drawArrays(gl.TRIANGLES, 0, 6);
                ndraws += 1;
            }
            if(drawStages) { 
                gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, this.pixels);
                cv.utils.showRGBA(this.pixels, this.width, this.height);
            }
        }

        if(drawStages) {
            $('<br>').appendTo('body');
        }


        scale *= this.scaleFactor;
        scaleN += 1;
    }

    // Gather the rectangles from the image
    gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, this.pixels);
    //cv.utils.showRGBA(this.pixels, this.width, this.height);
    var k, x, y, pixelValue, scaleBy;
    for (k = 0; k < this.width * this.height; k += 1) {
        // Scale number stored as pixel value
        pixelValue = this.pixels[k * 4];
        if (pixelValue != 0) {
            scaleBy = Math.pow(this.scaleFactor, pixelValue-1);
            x = (k) % this.width;
            y = Math.floor((k) / this.width);
            rectangles.push([x, y, this.windowSize * scaleBy, this.windowSize * scaleBy]);
        }
    }

    if(timeStage) {
        console.log("stageTimes", this.stageTimes);
    }

    console.log("number of draw calls:", ndraws);
    var detectTime = new Date() - detectTimeStart;
    var totalTime = new Date() - totalTimeStart;
    console.log("Detection time:", detectTime, "Detection+integral:", totalTime);
    window.times.push(detectTime);
    gl.disable(gl.DEPTH_TEST);
    return rectangles;
}

FaceDetector.prototype.setupShaders = function (vertexShader, fragShader, nstagesTest) {
    var shaderArray = [],
        cascade = this.cascade,
        vertexAttributes,
        lbpShader,
        nstages = nstagesTest || this.nstages, 
        nweak,
        s,
        k,
        stage,
        uniforms;

    if (vertexShader === undefined) {
        vertexShader = "lbpStage";
    }
    if (fragShader === undefined) {
        fragShader = "lbpStage";
    }

    // A simple rectangle (2 triangles)
    var vertCoords = new Float32Array([
        0.0,        0.0,
        this.width, 0.0,
        0.0,        this.height,
        0.0,        this.height,
        this.width, 0.0,
        this.width, this.height]);

    this.vertBuf = cv.shaders.arrayBuffer(vertCoords);

    for (s = 0; s < nstages; s += 1) {
        stage = cascade.stages[s];
        nweak = stage.weakClassifiers.length;
        
        var defs = {"STAGEN": s,
                    "NWEAK": nweak};

        if (showImage) {
            defs["DEBUG_SHOWIMG"] = 1;
        }
        if (zCull) {
            defs["ZCULL"] = 1;
        }
        if (stencilCull) {
            //XXX
            defs["ZCULL"] = 1;
        }

        if(s == nstages-1) {
            defs["LAST_STAGE"] = 1;
        }

        lbpShader = cv.shaders.getNamedShader(vertexShader, fragShader, {"defines": defs});
        gl.useProgram(lbpShader);

        uniforms = {
            "uResolution": [this.width, this.height],
            "uIntegralImageSize": [this.integralWidth, this.integralHeight],
            "uImageSize": [this.width, this.height],
            "stageThreshold": stage.stageThreshold - THRESHOLD_EPS,
            "leafValues": [],
            "featureRectangles": [],
            "lbpLookupTableSize": this.lbpLookupTableSize,
            "uSampler": 0,
            "lbpLookupTexture": 1,
            "scale": 1.0,
            "scaleN": 1,
            "activeWindows": 2
        };

        for (k = 0; k < nweak; k += 1) {
            uniforms.leafValues = uniforms.leafValues.concat(stage.weakClassifiers[k].leafValues);
            uniforms.featureRectangles = uniforms.featureRectangles.concat(stage.weakClassifiers[k].featureRectangle);
        }

        cv.shaders.setUniforms(lbpShader, uniforms);

        cv.shaders.setAttributes(lbpShader, {aPosition: this.vertBuf});

        shaderArray.push(lbpShader);
    }

    return shaderArray;
}

FaceDetector.prototype.calculateLBPLookupTableSize = function() {
    var cascade = this.cascade,
        stages = cascade.stages,
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
    texHeight = this.nstages;

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
        lbpArrangements = 256,
        dim = this.lbpLookupTableSize,
        texWidth = dim[0],
        texHeight = dim[1],
        k,
        wi,
        lbpMapArray,
        bitvec,
        lbpVal,
        bit;

    lbpMapArray = new Uint8Array(texWidth * texHeight);

    for (k = 0; k < this.nstages; k += 1) {
        for (wi = 0; wi < stages[k].weakClassifiers.length; wi += 1) {
            bitvec = stages[k].weakClassifiers[wi].categoryBitVector;
            for (lbpVal = 0; lbpVal < lbpArrangements; lbpVal += 1) {
                bit = Boolean(bitvec[lbpVal >> 5] & (1 << (lbpVal & 31)));
                lbpMapArray[(wi * lbpArrangements + lbpVal) + k * texWidth] = bit * 255;
            }
        }
    }

    return cv.gpu.uploadArrayToTexture(lbpMapArray, null, texWidth, texHeight,
             {filter: gl.NEAREST, format: gl.LUMINANCE,
              type: gl.UNSIGNED_BYTE, flip: false});
}

FaceDetector.prototype.benchmarkShader = function (niters, vs, fs, stage) {
    vs = vs || "benchmark16Lookups";
    fs = fs || vs;
    if (stage === undefined) {stage = 0};
    niters = niters || 20;
    var shaders = this.setupShaders(vs, fs);
    var shaderIdx = stage;
    gl.useProgram(shaders[shaderIdx]);
    cv.shaders.setUniforms(shaders[shaderIdx], {"scale": 1.0, "scaleN": 1});

    // Bind textures for the integral image and LBP lookup table
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.integralTexture);
    // try different image
    //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, $('img').get(0));
    //gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.FLOAT, $('img').get(0));
    var outWidth, outHeight;
    if(fs.indexOf("4InOne") != -1) {
        outWidth = this.width/2;
        outHeight = this.height/2;
    }
    else if(fs.indexOf("2InOne") != -1) {
        outWidth = this.width/2;
        outHeight = this.height;
    }
    else if(fs.indexOf("3InOne") != -1) {
        outWidth = this.width/3;
        outHeight = this.height;
    } else{
        outWidth = this.width;
        outHeight = this.height;
    }
    //outWidth = this.width;
    //outHeight = this.height;

    outWidth = Math.floor(outWidth);
    outHeight = Math.floor(outHeight);
    console.log(outWidth, outHeight);
    gl.viewport(0, 0, outWidth, outHeight);

    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.BLEND);
    var start = new Date();
    for(var i=0; i<niters; i++) {
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.pixels);
    }
    var time = new Date() - start;
    gl.readPixels(0, 0, outWidth, outHeight, gl.RGBA, gl.UNSIGNED_BYTE, this.pixels);
    cv.utils.showRGBA(this.pixels, outWidth, outHeight);
    return time/niters;

}


function unpack4InOne(image, outw, outh) {
    var inw = Math.floor(outw/2);
    var inh = Math.floor(outh/2);

    var outImage = new Uint8Array(outw * outh);
    for(var x=0; x<inw; x+=1) {
        for(var y=0; y<inh; y+=1) {
            var in_red   = image[0 + x*4 + (inw * 4 * y)];
            var in_green = image[1 + x*4 + (inw * 4 * y)];
            var in_blue  = image[2 + x*4 + (inw * 4 * y)];
            var in_alpha = image[3 + x*4 + (inw * 4 * y)];

            var out_x = x*2;
            var out_y = y*2;

            outImage[out_x + out_y * outw] = in_red;
            outImage[(out_x + 1) + out_y * outw] = in_green;
            outImage[(out_x + 1) + (out_y + 1) * outw] = in_blue;
            outImage[out_x + (out_y + 1) * outw] = in_alpha;

        }
    }

    cv.utils.showGrayscale(outImage, outw, outh);

}
