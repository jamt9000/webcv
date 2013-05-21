var debugLBP = false;

function dimensionsOfLBPLookupTable(cascade) {
    var stages = cascade.stages,
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

function createLBPLookupTable(cascade, dim) {
    var maxWeakClassifiers = 0,
        stages = cascade.stages,
        nstages = stages.length,
        lbpArrangements = 256,
        texWidth = dim[0],
        texHeight = dim[1],
        k,
        w,
        lbpMapArray,
        bitvec,
        lbpVal,
        bit;

    lbpMapArray = new Uint8Array(texWidth * texHeight);

    for (k = 0; k < stages.length; k += 1) {
        for (w = 0; w < stages[k].weakClassifiers.length; w += 1) {
            bitvec = stages[k].weakClassifiers[w].categoryBitVector;
            for (lbpVal = 0; lbpVal < lbpArrangements; lbpVal += 1) {
                bit = Boolean(bitvec[lbpVal >> 5] & (1 << (lbpVal & 31)));
                lbpMapArray[(w * lbpArrangements + lbpVal) + k * texWidth] = bit * 255;
            }
        }
    }

    return lbpMapArray;
}


function imageToArray(image) {
    var w = image.width;
    var h = image.height;
    var canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    var context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);

    var imageData = context.getImageData(0, 0, w, h);

    var image_u8 = imageData.data;

    var nbytes = w * h;

    var gray_u8 = new Uint8ClampedArray(nbytes);

    var k;
    for(k = 0; k < nbytes; k++){
        // Simple grayscale by intensity average
        gray_u8[k] = (image_u8[k*4] + image_u8[k*4 + 1] + image_u8[k*4 + 2]) / 3;
    }
    return gray_u8;
}

function debugShowGrayscale(data_u8, w, h) {
    var canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    var context = canvas.getContext('2d');

    var imageData = context.createImageData(w, h);
    
    var k;
    for(k = 0; k < w*h; k++) {
        var grayByte = data_u8[k];
        imageData.data[k*4] = grayByte;
        imageData.data[k*4 + 1] = grayByte;
        imageData.data[k*4 + 2] = grayByte;
        imageData.data[k*4 + 3] = 255;
    }
    context.putImageData(imageData, 0, 0);
    document.body.appendChild(canvas);
}

function integralImage(in_u8, w, h, out){
    if (out === undefined) {
        out = new Float32Array((w+1) * (h+1));
    }

    // Algorithm adapted from opencv

    var src = 0;
    var sum = 0;

    var srcstep = w;
    var sumstep = w+1;

    // memset( sum, 0, (size.width+1)*sizeof(sum[0]));
    for(x=0; x< w+1; x++){
        out[x] = 0;
    }

    sum += sumstep + 1;

    var y, s;

    for(y = 0; y < h; y++, src += srcstep, sum += sumstep) {
        var s = 0;
        out[sum-1] = 0;
        for( x = 0; x < w; x += 1 ) {
            s += in_u8[src + x];
            var val = out[sum + x - sumstep] + s;
            //console.log(val)
            out[sum + x] = val
        }
    }
    return out;
}

function evaluateStage(integralIm, stage, stageN, w_orig, h_orig, acceptedWindows, scale) {

    var startTime = new Date();
    var x, y;
    var winsize = Math.round(24*scale);
    var w_integral = w_orig + 1;
    var h_integral = h_orig + 1;
    var w;
    var offs;
    var rectangle;
    var weaks = stage.weakClassifiers;
    var stageThreshold = stage.stageThreshold;
    var nweak = weaks.length;
    var weak;
    var rect;
    var rx, ry, rw, rh;
    var iim = integralIm;
    var naccepted = 0;
    var bit;

    var p0,p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13,p14,p15;

    var r0,r1,r2,r3,r4,r5,r6,r7,c;

    var nwins = 0;

    var lbpImage = new Uint8Array(w_integral * h_integral);

    for(y = 0; y < h_orig-winsize; y++) {
        for(x = 0; x < w_orig-winsize; x++) {
            if(x + winsize < w_orig && y + winsize < h_orig) {
                offs = x + w_integral * y;

                if(stageN > 0 && !acceptedWindows[offs]) {
                    continue;
                }

                nwins++;
                var contribution = 0;
                
                for(w = 0; w < nweak; w++) {
                    weak = stage.weakClassifiers[w];
                    rect = weak.featureRectangle;
                    bitvec = weak.categoryBitVector;
                    rx = Math.round(rect[0] * scale);
                    ry = Math.round(rect[1] * scale);
                    rw = Math.round(rect[2] * scale);
                    rh = Math.round(rect[3] * scale);

                    // Sample 16 points from integral image to compute LBP value
                    
                    /* p0  p1   p4  p5
                       p2  p3   p6  p7
                       p12 p13  p8  p9
                       p14 p15 p10 p11
                    */

                    // Top left quadrant
                    p0 = iim[offs + rx + ry * w_integral];  // top left point
                    p1 = iim[offs + (rx + rw) + ry * w_integral]; // top right pt
                    p2 = iim[offs + rx + (ry + rh) * w_integral]; // bottom left pt
                    p3 = iim[offs + (rx + rw) + (ry + rh) * w_integral]; // bottom right

                    // Top right quadrant
                    rx += 2 * rw;
                    p4 = iim[offs + rx + ry * w_integral];  // top left point
                    p5 = iim[offs + (rx + rw) + ry * w_integral]; // top right pt
                    p6 = iim[offs + rx + (ry + rh) * w_integral]; // bottom left pt
                    p7 = iim[offs + (rx + rw) + (ry + rh) * w_integral]; // bottom right

                    // Bottom right quadrant
                    ry += 2 * rh;
                    p8 = iim[offs + rx + ry * w_integral];  // top left point
                    p9 = iim[offs + (rx + rw) + ry * w_integral]; // top right pt
                    p10 = iim[offs + rx + (ry + rh) * w_integral]; // bottom left pt
                    p11 = iim[offs + (rx + rw) + (ry + rh) * w_integral]; // bottom right

                    // Bottom left quadrant
                    rx -= 2 * rw;
                    p12 = iim[offs + rx + ry * w_integral];  // top left point
                    p13 = iim[offs + (rx + rw) + ry * w_integral]; // top right pt
                    p14 = iim[offs + rx + (ry + rh) * w_integral]; // bottom left pt
                    p15 = iim[offs + (rx + rw) + (ry + rh) * w_integral]; // bottom right

                    /* Compute intensities from integral images values
                        r0 r1 r2
                        r7 c  r3
                        r6 r5 r4
                    */

                    c = p8 - p6 - p13 + p3;

                    r0 = p3 - p2 - p1 + p0;
                    r1 = p6 - p4 - p3 + p1;
                    r2 = p7 - p5 - p6 + p4;
                    r3 = p9 - p7 - p8 + p6;
                    r4 = p11 - p9 - p10 + p8;
                    r5 = p10 - p8 - p15 + p13;
                    r6 = p15 - p13 - p14 + p12;
                    r7 = p13 - p3 - p12 + p2;

                    var lbp = ((r0 > c) << 7) + ((r1 > c) << 6) + ((r2 > c) << 5) + ((r3 > c) << 4) + ((r4 > c) << 3) + ((r5 > c) << 2) + ((r6 > c) << 1) + (r7 > c);

                    bit = Boolean(bitvec[lbp >> 5] & (1 << (lbp & 31)));
                    //bit = window.lbpLookup[256 * w + lbp + lbpDim[0] * stageN];

                    contribution += bit ? weak.leafValues[0] : weak.leafValues[1];


                    if(w == 1) {
                        lbpImage[offs] = lbp;
                    }

                    //if(w == 1) {
                    //    lbpImage[offs] = Boolean(bit) * 255;
                    //}
                    
                    //console.log(lbp)
                }

                if(contribution > stageThreshold) { 
                    naccepted++;
                    acceptedWindows[offs] = 255;
                }
                else {
                    acceptedWindows[offs] = 0;
                }
            }
        }
    }

    if (debugLBP) {
        document.body.appendChild(document.createElement('br'));
        debugShowGrayscale(acceptedWindows, w_integral, h_integral);
        debugShowGrayscale(lbpImage, w_integral, h_integral);
    }

    var endTime = new Date();
    var runTime = endTime - startTime;

    console.log("Stage %d time %d nwins %d", stageN, runTime, nwins);

}

function runCascade(image, cascade) {
    var image_u8 = imageToArray(image);

    window.lbpDim = dimensionsOfLBPLookupTable(cascade);
    window.lbpLookup = createLBPLookupTable(cascade, lbpDim);

    var startCascadeTime = new Date();

    var integralIm = integralImage(image_u8, image.width, image.height);
    var w = image.width;
    var h = image.height;
    var w_integral = image.width + 1;
    var h_integral = image.height + 1;

    var stageN = 0;
    var stageCount = cascade.stages.length;

    var windowSize = 24;


    var scaleFactor = 1.2;
    var scale;
    var rectangles = []

    for(scale = 1.0; scale * windowSize < w && scale * windowSize < h; scale *= scaleFactor) {
        var scaledWindowSize = Math.round(scale * windowSize);
        var acceptedWindows = new Uint8Array((image.width+1) * (image.height+1));
        for(stageN = 0; stageN < stageCount; stageN++) {
            evaluateStage(integralIm, cascade.stages[stageN], stageN, image.width, image.height, acceptedWindows, scale);
        }
        debugShowGrayscale(acceptedWindows, w_integral, h_integral);
        for(y = 0; y < (h_integral); y++) {
            for(x = 0; x < (w_integral); x++) {
                var offs = x + w_integral * y;
                if(acceptedWindows[offs] == 255) {
                    //console.log("%d,%d", x, y);
                    rectangles.push([x, y, scaledWindowSize, scaledWindowSize]);

                    image_u8[x + y * image.width] = 255;
                }  
            }
        }
    }

    var endCascadeTime = new Date();

    var cascadeTime = endCascadeTime - startCascadeTime;

    console.log("cascade time %d", cascadeTime);
    

    debugShowGrayscale(image_u8, image.width, image.height);
    return rectangles;
    
}
