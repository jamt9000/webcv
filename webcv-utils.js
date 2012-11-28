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
            }
        };
    };

    WebCV.registerModule("utils", utils);
}(WebCV, window, document));
