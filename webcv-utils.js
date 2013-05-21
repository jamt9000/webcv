/*jslint es5: true, browser: true, devel: true */
/*global WebCV */

(function (WebCV, window, document, undefined) {
    "use strict";

    var utils = function () {
        return {
            /**
             * Utility function to create a video element
             * and add it to the document
             */
            createVideoElement: function (src, options) {
                var video = document.createElement("video"),
                    p;

                video.src = src;
                video.style = "display:none;";

                for (p in options) {
                    if (options.hasOwnProperty(p)) {
                        video[p] = options[p];
                    }
                }
                document.body.appendChild(video);
            },


            /**
             * Wrapper around browser-specific getUserMedia functions
             */
            getUserMedia: function (constraints, success, error) {
                // Try the different browser prefixes
                if (navigator.getUserMedia) {
                    navigator.getUserMedia(constraints, success, error);
                } else if (navigator.webkitGetUserMedia) {
                    navigator.webkitGetUserMedia(constraints, function (s) {success(window.webkitURL.createObjectURL(s)); }, error);
                } else if (navigator.mozGetUserMedia) {
                    navigator.mozGetUserMedia(constraints, success, error);
                } else {
                    // Not supported
                    return false;
                }
                return true;
            },

            /**
             * Wrapper for requestAnimationFrame
             */
            requestAnimationFrame: function (callback) {
                var requestAnimFunction = (window.requestAnimationFrame || window.webkitRequestAnimationFrame
                                           || window.mozRequestAnimationFrame || window.msRequestAnimationFrame);
                if (requestAnimFunction) {
                    return requestAnimFunction(callback);
                } else {
                    setTimeout(callback, 30);
                }
            },

            showRGBA: function (array, w, h) {
                var canvas = document.createElement("canvas"),
                    context,
                    imageData;

                canvas.width = w;
                canvas.height = h;
                context = canvas.getContext('2d');
                imageData = context.createImageData(w, h);
                imageData.data.set(array.subarray(0,w*h*4));
                context.putImageData(imageData, 0, 0);
                var im = document.createElement("img");
                im.src = canvas.toDataURL();
                im.width = w;
                im.height = h;
                im.className = "webcvimage";
                document.body.appendChild(im);
            },

            showGrayscale: function (data_u8, w, h) {
                var canvas = document.createElement("canvas"),
                    context,
                    imageData,
                    k,
                    grayByte;

                canvas.width = w;
                canvas.height = h;
                context = canvas.getContext('2d');
                imageData = context.createImageData(w, h);

                for (k = 0; k < w * h; k += 1) {
                    grayByte = data_u8[k];
                    imageData.data[k * 4] = grayByte;
                    imageData.data[k * 4 + 1] = grayByte;
                    imageData.data[k * 4 + 2] = grayByte;
                    imageData.data[k * 4 + 3] = 255;
                }

                context.putImageData(imageData, 0, 0);
                var im = document.createElement("img");
                im.width = w;
                im.height = h;
                im.src = canvas.toDataURL();
                im.className = "webcvimage";
                document.body.appendChild(im);
            }
        };
    };

    WebCV.registerModule("utils", utils);
}(WebCV, window, document));
