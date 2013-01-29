/*jslint es5: true, browser: true, devel: true */
/*global WebCV, Float32Array, Uint8ClampedArray */

(function (WebCV, window, document, undefined) {
    "use strict";

    var imgproc = function () {
        var workCanvas = document.createElement("canvas");

        return {
            /**
             * Convert an image element to a greyscale Uint8 array,
             * using a canvas element
             */
            imageToGreyArray: function (image, outarray) {
                var w = image.width,
                    h = image.height,
                    canvas = workCanvas,
                    context,
                    imageData,
                    image_u8,
                    nbytes,
                    grey_u8,
                    k;

                canvas.width = w;
                canvas.height = h;

                context = canvas.getContext('2d');
                context.drawImage(image, 0, 0);

                imageData = context.getImageData(0, 0, w, h);
                image_u8 = imageData.data;
                nbytes = w * h;

                if (outarray === undefined) {
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
            }

        };
    };

    WebCV.registerModule("imgproc", imgproc);
}(WebCV, window, document));
