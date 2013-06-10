/*jslint es5: true, browser: true, devel: true */
/*global WebCV, Float32Array, Uint8ClampedArray */

(function (WebCV, window, document, undefined) {
    "use strict";

    var imgproc = function () {
        var workCanvas = document.createElement("canvas");
        var workContext = workCanvas.getContext('2d');
        var integralShader;
        var integralVertexBuf;
        var integralTextureCoordBuf;
        var integralCachedWidth;
        var integralCachedHeight;
        var integralfb;


        return {
            /**
             * Convert an image element to a greyscale Uint8 array,
             * using a canvas element
             * can scale image to swidth*sheight
             */
            imageToGreyArray: function (image, outarray, swidth, sheight) {
                var w = swidth,
                    h = sheight,
                    canvas = workCanvas,
                    imageData,
                    image_u8,
                    nbytes,
                    grey_u8,
                    k;

                if (w === undefined) {
                    w = image.width;
                }
                if(h === undefined) {
                    h = image.height;
                }

                canvas.width = w;
                canvas.height = h;

                workContext.drawImage(image, 0, 0, w, h);

                var start = new Date();
                imageData = workContext.getImageData(0, 0, w, h);
                console.log("Grey getImageData time", new Date() - start);
                image_u8 = imageData.data;
                nbytes = w * h;

                if (outarray === undefined || outarray === null) {
                    grey_u8 = new Uint8ClampedArray(nbytes);
                } else {
                    grey_u8 = outarray;
                }


                for (k = 0; k < nbytes; k += 1) {
                    // Simple greyscale by intensity average
                    grey_u8[k] = (image_u8[k * 4] + image_u8[k * 4 + 1] + image_u8[k * 4 + 2]) / 3;
                }
                

                return grey_u8;
            },


            /**
             * Compute the integral image from a grayscale Uint8 array. The output image will be one greater
             * than the input in width and height.
             * Output array may be any type, but should be able to represent large values 
             * (up to the sum of all pixel intensities in an image)
             * Algorithm adapted from OpenCV
             */
            integralImage: function (in_u8, w, h, out) {
                var srcIndex = 0,
                    sumIndex = 0,
                    srcStep = w,
                    sumStep = w + 1,
                    x,
                    y,
                    s;

                if (out === undefined) {
                    out = new Float32Array((w + 1) * (h + 1));
                }

                // Algorithm adapted from opencv

                // Set first row to all 0s
                // Replaces `memset( sum, 0, (size.width+1)*sizeof(sum[0]));`
                for (x = 0; x < w + 1; x += 1) {
                    out[x] = 0;
                }

                sumIndex += sumStep + 1;

                for (y = 0; y < h; y += 1, srcIndex += srcStep, sumIndex += sumStep) {
                    s = 0;
                    // Set first column to 0
                    out[sumIndex - 1] = 0;
                    for (x = 0; x < w; x += 1) {
                        s += in_u8[srcIndex + x];
                        out[sumIndex + x] = out[sumIndex + x - sumStep] + s;
                    }
                }
                return out;
            },

            integralImageGPU: function (inTexture, w, h, outTexture) {
                var cv = this.core,
                    gl = cv.gl;

                var debug = false;

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, inTexture);

                if(debug) {
                var testOutTexture = cv.gpu.blankTexture(w+1, h+1,
                 {format: gl.RGBA, type: gl.UNSIGNED_BYTE, flip: false});
                outTexture = testOutTexture;
                }

                integralShader = integralShader || cv.shaders.getNamedShader("integralImage");
                gl.useProgram(integralShader);
                cv.shaders.setUniforms(integralShader, {uResolution: [w+1,h+1]});
                integralfb = gl.createFramebuffer();

                gl.bindFramebuffer(gl.FRAMEBUFFER, integralfb);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outTexture, 0);
                gl.clearColor(0.0,0.0,0.0,1.0);
                gl.clear(gl.COLOR_BUFFER_BIT);

                // Number of diagonal pixels
                var nquads = Math.floor(Math.sqrt(w*w + h*h));
                var nquads = Math.min(w, h);
                var vertexData = new Int16Array(nquads * 6 * 2);
                var texCoordData = new Uint8Array(nquads * 6 * 2);
                for (var i=0; i<nquads; i+=80) {
                    var offs = i+1;

                    // Vertex coordinates
                    // Bottom left
                    vertexData[6*2*i+0] = 0.0 + offs;
                    vertexData[6*2*i+1] = 0.0 + offs;
                    // Bottom right
                    vertexData[6*2*i+2] = w + offs;
                    vertexData[6*2*i+3] = 0.0 + offs;
                    // Top left
                    vertexData[6*2*i+4] = 0.0 + offs;
                    vertexData[6*2*i+5] = h + offs;
                    // Top left
                    vertexData[6*2*i+6] = 0.0 + offs;
                    vertexData[6*2*i+7] = h + offs;
                    // Bottom right
                    vertexData[6*2*i+8] = w + offs;
                    vertexData[6*2*i+9] = 0.0 + offs;
                    // Top right
                    vertexData[6*2*i+10] = w + offs;
                    vertexData[6*2*i+11] = h + offs;

                    // Texture coordinates
                    // Bottom left
                    texCoordData[6*2*i+0] = 0.0;
                    texCoordData[6*2*i+1] = 0.0;
                    // Bottom right
                    texCoordData[6*2*i+2] = 1.0;
                    texCoordData[6*2*i+3] = 0.0;
                    // Top left
                    texCoordData[6*2*i+4] = 0.0;
                    texCoordData[6*2*i+5] = 1.0;
                    // Top left
                    texCoordData[6*2*i+6] = 0.0;
                    texCoordData[6*2*i+7] = 1.0;
                    // Bottom right
                    texCoordData[6*2*i+8] = 1.0;
                    texCoordData[6*2*i+9] = 0.0;
                    // Top right
                    texCoordData[6*2*i+10] = 1.0;
                    texCoordData[6*2*i+11] = 1.0;
                }
                window.vertexData = vertexData;

                integralVertexBuf = cv.shaders.arrayBuffer(vertexData);
                integralTextureCoordBuf = cv.shaders.arrayBuffer(texCoordData);
                integralCachedWidth = w;
                integralCachedHeight = h;

                cv.shaders.setAttributes(integralShader,
                        {aPosition: integralVertexBuf, aTextureCoord: integralTextureCoordBuf});
                gl.viewport(0,0,w+1,h+1);

                gl.disable(gl.DEPTH_TEST);

                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
                if (debug) {
                    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                }
                gl.bindFramebuffer(gl.FRAMEBUFFER, integralfb);
                gl.drawArrays(gl.TRIANGLES, 0, 6*nquads);
                //gl.drawArrays(gl.TRIANGLES, 0, 6*nquads);
                gl.disable(gl.BLEND);


                if (debug) {
                var readOut = new Uint8Array((w+1) * (h+1) * 4);
                gl.readPixels(0,0,w+1,h+1,gl.RGBA,gl.UNSIGNED_BYTE,readOut);
                cv.utils.showRGBA(readOut, w+1, h+1);
                return readOut;
                }
            },

            testFloatToBytes: function() {
                var w = fd.width;
                var h = fd.height;
                var toBytesShader = cv.shaders.getNamedShader("drawconst", "integralToBytes");
                gl.useProgram(toBytesShader);
                cv.shaders.setUniforms(toBytesShader, {"uResolution": [w+1,h+1], "uIntegralImageSize": [w+1,h+1]});
                var vertCoords = new Float32Array([
                        0.0,        0.0,
                        w+1, 0.0,
                        0.0,        h+1,
                        0.0,        h+1,
                        w+1, 0.0,
                        w+1, h+1]);
                cv.shaders.setAttributes(toBytesShader,{aPosition: vertCoords});

                // Bind integral as texture0
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, fd.integralTexture);
                var testOutTexture = cv.gpu.blankTexture(w+1, h+1,
                 {format: gl.RGBA, type: gl.UNSIGNED_BYTE, flip: false});
                var outfb = gl.createFramebuffer();

                gl.bindFramebuffer(gl.FRAMEBUFFER, outfb);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, testOutTexture, 0);
                gl.viewport(0,0,w+1,h+1);
                gl.drawArrays(gl.TRIANGLES, 0, 6);

                var readOut = new Uint8Array((w+1) * (h+1) * 4);
                window.readOut = readOut;
                gl.readPixels(0,0,w+1,h+1,gl.RGBA,gl.UNSIGNED_BYTE,readOut);
                cv.utils.showRGBA(readOut, w+1, h+1);

                var outFloat = new Float32Array((w+1) * (h+1));

                for (var k = 0; k < (w+1) * (h+1); k += 1) {
                    // Simple greyscale by intensity average
                    outFloat[k] = readOut[k * 4] * 65536 + readOut[k * 4 + 1] * 256 + readOut[k * 4 + 2];
                }



                return outFloat;


            }

        };
    };

    WebCV.registerModule("imgproc", imgproc);
}(WebCV, window, document));
