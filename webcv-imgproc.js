/*jslint es5: true, browser: true, devel: true */
/*global WebCV, Float32Array, Uint8ClampedArray */

(function (WebCV, window, document, undefined) {
    "use strict";

    var imgproc = function () {
        var workCanvas = document.createElement("canvas");
        var workContext = workCanvas.getContext('2d');
        var integralShader;
        var vpass_integralVertexBuf;
        var vpass_integralTextureCoordBuf;
        var hpass_integralVertexBuf;
        var hpass_integralTextureCoordBuf;
        var integralCachedWidth;
        var integralCachedHeight;
        var integralfb1;
        var integralfb2;



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

                //var start = performance.now();
                imageData = workContext.getImageData(0, 0, w, h);
                //console.log("Grey getImageData time", performance.now() - start);
                image_u8 = imageData.data;
                nbytes = w * h;

                if (outarray === undefined || outarray === null) {
                    grey_u8 = new Uint8ClampedArray(nbytes);
                } else {
                    grey_u8 = outarray;
                }


                for (k = 0; k < nbytes; k += 1) {
                    // Simple greyscale by intensity average
                    grey_u8[k] = (0.299 * image_u8[k * 4] + 0.587 * image_u8[k * 4 + 1] + 0.114 * image_u8[k * 4 + 2]);
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

                if(debug) {
                var testOutTexture = cv.gpu.blankTexture(w+1, h+1,
                 {format: gl.RGBA, type: gl.UNSIGNED_BYTE, flip: false});
                outTexture = testOutTexture;
                }

                if(debug) {
                var intermediateTexture = cv.gpu.blankTexture(w+1, h+1,
                 {format: gl.RGBA, type: gl.UNSIGNED_BYTE, flip: false});
                } else {
                var intermediateTexture = cv.gpu.blankTexture(w+1, h+1,
                 {format: gl.LUMINANCE, type: gl.FLOAT, flip: false});
                }

                var defs = {}
                if(debug) {
                    defs["DEBUG"] = 1;
                }

                integralShader = integralShader || cv.shaders.getNamedShader("integralImage", "integralImage", {defines:defs});
                gl.useProgram(integralShader);
                cv.shaders.setUniforms(integralShader, {uResolution: [w+1,h+1]});
                integralfb1 = gl.createFramebuffer();
                integralfb2 = gl.createFramebuffer();


                gl.bindFramebuffer(gl.FRAMEBUFFER, integralfb1);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, intermediateTexture, 0);
                gl.clearColor(0.0,0.0,0.0,1.0);
                gl.clear(gl.COLOR_BUFFER_BIT);


                gl.bindFramebuffer(gl.FRAMEBUFFER, integralfb2);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outTexture, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);


                var vpass_vertexData = new Int16Array(h * 6 * 2);
                var vpass_texCoordData = new Uint8Array(h * 6 * 2);
                var hpass_vertexData = new Int16Array(w * 6 * 2);
                var hpass_texCoordData = new Uint8Array(w * 6 * 2);
                for (var i=0; i<h; i+=1) {
                    var xoffs = 0;
                    var yoffs = i+1;
                    // Vertex coordinates
                    // Bottom left
                    vpass_vertexData[6*2*i+0] = 0.0 + xoffs;
                    vpass_vertexData[6*2*i+1] = 0.0 + yoffs;
                    // Bottom right
                    vpass_vertexData[6*2*i+2] = w + xoffs;
                    vpass_vertexData[6*2*i+3] = 0.0 + yoffs;
                    // Top left
                    vpass_vertexData[6*2*i+4] = 0.0 + xoffs;
                    vpass_vertexData[6*2*i+5] = h + yoffs;
                    // Top left
                    vpass_vertexData[6*2*i+6] = 0.0 + xoffs;
                    vpass_vertexData[6*2*i+7] = h + yoffs;
                    // Bottom right
                    vpass_vertexData[6*2*i+8] = w + xoffs;
                    vpass_vertexData[6*2*i+9] = 0.0 + yoffs;
                    // Top right
                    vpass_vertexData[6*2*i+10] = w + xoffs;
                    vpass_vertexData[6*2*i+11] = h + yoffs;

                    // Texture coordinates
                    // Bottom left
                    vpass_texCoordData[6*2*i+0] = 0.0;
                    vpass_texCoordData[6*2*i+1] = 0.0;
                    // Bottom right
                    vpass_texCoordData[6*2*i+2] = 1.0;
                    vpass_texCoordData[6*2*i+3] = 0.0;
                    // Top left
                    vpass_texCoordData[6*2*i+4] = 0.0;
                    vpass_texCoordData[6*2*i+5] = 1.0;
                    // Top left
                    vpass_texCoordData[6*2*i+6] = 0.0;
                    vpass_texCoordData[6*2*i+7] = 1.0;
                    // Bottom right
                    vpass_texCoordData[6*2*i+8] = 1.0;
                    vpass_texCoordData[6*2*i+9] = 0.0;
                    // Top right
                    vpass_texCoordData[6*2*i+10] = 1.0;
                    vpass_texCoordData[6*2*i+11] = 1.0;
                }
                for (var i=0; i<w; i+=1) {
                    var xoffs = i+1;
                    var yoffs = 0;
                    // Vertex coordinates
                    // Bottom left
                    hpass_vertexData[6*2*i+0] = 0.0 + xoffs;
                    hpass_vertexData[6*2*i+1] = 0.0 + yoffs;
                    // Bottom right
                    hpass_vertexData[6*2*i+2] = 1+w + xoffs;
                    hpass_vertexData[6*2*i+3] = 0.0 + yoffs;
                    // Top left
                    hpass_vertexData[6*2*i+4] = 0.0 + xoffs;
                    hpass_vertexData[6*2*i+5] = 1+h + yoffs;
                    // Top left
                    hpass_vertexData[6*2*i+6] = 0.0 + xoffs;
                    hpass_vertexData[6*2*i+7] = 1+h + yoffs;
                    // Bottom right
                    hpass_vertexData[6*2*i+8] = 1+w + xoffs;
                    hpass_vertexData[6*2*i+9] = 0.0 + yoffs;
                    // Top right
                    hpass_vertexData[6*2*i+10] = 1+w + xoffs;
                    hpass_vertexData[6*2*i+11] = 1+h + yoffs;

                    // Texture coordinates
                    // Bottom left
                    hpass_texCoordData[6*2*i+0] = 0.0;
                    hpass_texCoordData[6*2*i+1] = 0.0;
                    // Bottom right
                    hpass_texCoordData[6*2*i+2] = 1.0;
                    hpass_texCoordData[6*2*i+3] = 0.0;
                    // Top left
                    hpass_texCoordData[6*2*i+4] = 0.0;
                    hpass_texCoordData[6*2*i+5] = 1.0;
                    // Top left
                    hpass_texCoordData[6*2*i+6] = 0.0;
                    hpass_texCoordData[6*2*i+7] = 1.0;
                    // Bottom right
                    hpass_texCoordData[6*2*i+8] = 1.0;
                    hpass_texCoordData[6*2*i+9] = 0.0;
                    // Top right
                    hpass_texCoordData[6*2*i+10] = 1.0;
                    hpass_texCoordData[6*2*i+11] = 1.0;
                }

                vpass_integralVertexBuf = cv.shaders.arrayBuffer(vpass_vertexData);
                vpass_integralTextureCoordBuf = cv.shaders.arrayBuffer(vpass_texCoordData);

                hpass_integralVertexBuf = cv.shaders.arrayBuffer(hpass_vertexData);
                hpass_integralTextureCoordBuf = cv.shaders.arrayBuffer(hpass_texCoordData);

                integralCachedWidth = w;
                integralCachedHeight = h;

                gl.disable(gl.DEPTH_TEST);

                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
                if (debug) {
                    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                }

                for(var i=0; i<100; i++) {


                //var integralstart = performance.now();


                // Do vertical pass
                cv.shaders.setUniforms(integralShader, {uPass: 1});

                cv.shaders.setAttributes(integralShader,
                        {aPosition: vpass_integralVertexBuf, aTextureCoord: vpass_integralTextureCoordBuf});
                gl.viewport(0,0,w+1,h+1);

                gl.bindFramebuffer(gl.FRAMEBUFFER, integralfb1);

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, inTexture);

                gl.drawArrays(gl.TRIANGLES, 0, 6*h);

                // Do horiz pass
                cv.shaders.setUniforms(integralShader, {uPass: 2});

                cv.shaders.setAttributes(integralShader,
                        {aPosition: hpass_integralVertexBuf, aTextureCoord: hpass_integralTextureCoordBuf});

                gl.bindFramebuffer(gl.FRAMEBUFFER, integralfb2);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, intermediateTexture);
                gl.drawArrays(gl.TRIANGLES, 0, 6*w);

                gl.disable(gl.BLEND);

                //var readOut = new Uint8Array((w+1) * (h+1) * 4);
                //gl.readPixels(0,0,w+1,h+1,gl.RGBA,gl.UNSIGNED_BYTE,readOut);
                gl.finish();

                //var integraltime = performance.now() - integralstart;
                //console.log("Integral took", integraltime)
            }


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
