/*jslint es5: true, browser: true, devel: true */
/*global WebCV, Float32Array, Uint8Array, Uint8ClampedArray */

(function (WebCV, window, document, undefined) {
    "use strict";

    var gpu = function () {

        // Internal functions

        /**
         * Set the texture parameters according to params object
         */

        function setParams(gl, params) {
            var  flip = params.flip;

            if (flip === undefined) {
                flip = 1;
            }

            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip);

            // Support LightGL style paramater names 
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, params.TEXTURE_MAG_FILTER || params.filter || params.magFilter || gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, params.TEXTURE_MIN_FILTER || params.filter || params.minFilter || gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, params.wrap || params.TEXTURE_WRAP_S || params.wrapS || gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, params.wrap || params.TEXTURE_WRAP_T || params.wrapT || gl.CLAMP_TO_EDGE);
        }

        /**
         * Upload texture from image or array, using the right texImage2D function
         */
        function texImage(gl, pixels, params) {
            // w,h only needed in case of array
            var internalFormat,
                format,
                type;

            internalFormat = params.internalFormat || params.format || gl.RGBA;
            format = params.format || gl.RGBA;
            type = params.type || gl.UNSIGNED_BYTE;

            /* 
            There are 2 main versions of texImage2D, depending if we are using a raw array, or an image-like element.
            For the array width and height are needed.

            Spec:
            void texImage2D(GLenum target, GLint level, GLenum internalformat, 
                    GLsizei width, GLsizei height, GLint border, GLenum format, 
                    GLenum type, ArrayBufferView pixels);

            "If pixels is null, a buffer of sufficient size initialized to 0 is passed. "

            void texImage2D(GLenum target, GLint level, GLenum internalformat, GLenum format, GLenum type, ImageData pixels)

            */

            // Bad way to check if Array, since "instanceof ArrayBufferView" not currently exposed (it is in latest spec)
            if (pixels === null || Object.prototype.toString.call(pixels).indexOf("Array") !== -1) {
                if (params.width !== undefined && params.height !== undefined) {
                    //console.log(pixels);
                    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, params.width, params.height, 0, format, type, pixels);
                } else {
                    throw "Width and height not specified in params, and using Array";
                }
            } else {
                gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, format, type, pixels);
            }

        }

        // Public functions

        return {
            blankTexture: function (w, h, params) {
                return this.uploadArrayToTexture(null, null, w, h, params);
            },

            uploadArrayToTexture: function (array, texture, w, h, params) {
                params = params || {};
                params.width = w;
                params.height = h;

                return this.uploadToTexture(array, texture, params);
            },

            uploadToTexture: function (pixels, texture, params) {
                var gl = this.core.gl;

                params = params || {};

                texture = texture || gl.createTexture();

                gl.bindTexture(gl.TEXTURE_2D, texture);

                setParams(gl, params);

                texImage(gl, pixels, params);

                return texture;
            },

            downloadFramebuffer: function (fb, outArray, params) {
                var gl = this.core.gl,
                    oldfb = gl.getParameter(gl.FRAMEBUFFER_BINDING),
                    view = gl.getParameter(gl.VIEWPORT),
                    x = 0,
                    y = 0,
                    w = view[2],
                    h = view[3],
                    format = gl.RGBA,
                    type = gl.UNSIGNED_BYTE;

                params = params || {};

                if (params.x !== undefined) {
                    x = params.x;
                }

                if (params.y !== undefined) {
                    y = params.y;
                }

                if (params.width !== undefined) {
                    w = params.width;
                }

                if (params.height !== undefined) {
                    h = params.height;
                }

                format = params.format || format;
                type = params.type || type;

                gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

                if (outArray === undefined || outArray === null) {
                    outArray = new Uint8Array(w * h * 4);
                }

                gl.readPixels(x, y, w, h, format, type, outArray);

                gl.bindFramebuffer(gl.FRAMEBUFFER, oldfb);

                return outArray;

            }
        };
    };

    WebCV.registerModule("gpu", gpu);
}(WebCV, window, document));
