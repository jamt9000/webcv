/*jslint es5: true, browser: true, devel: true */

// Start closure
(function (window, document, undefined) {
    "use strict";

    var WebCV = {
        instanceList: [],

        modules: {},

        /**
        * The core of WebCV, which will be instantiated for each canvas
        * Uses a similar pattern to oCanvas in order to have an instance per canvas
        */
        core: function (canvas, options) {
            var m;

            WebCV.instanceList.push(this);

            this.textures = [];

            // Init modules
            for (m in WebCV.modules) {
                if (WebCV.modules.hasOwnProperty(m)) {
                    this[m] = WebCV.modules[m]();
                    // Set core in modules
                    this[m].core = this;
                }
            }

            // Reference to canvas element
            this.canvas = canvas;

            // Set up gl context
            this.gl = null;
            try {
                this.gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
            } catch (e) {
                console.log("WebGL not available");
            }
        },

        /**
         * Create a new instance of the core for a specific canvas
         */
        create: function (canvas, options) {
            return new WebCV.core(canvas, options);
        },

        registerModule: function (name, func) {
            WebCV.modules[name] = func;
        }
    };

    WebCV.prototype = {};

    WebCV.prototype.uploadTexture = function (image) {
        var texture,
            gl = this.gl;

        // Create empty texture object
        texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        // Upload to GPU
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        // Upscale method
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // Downscale method
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        // gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);

        return texture;
    };


    WebCV.prototype.setCurrentShader = function (shaderProgram) {
        var gl = this.gl;
        gl.useProgram(shaderProgram);
        gl.webcv_currentShader = shaderProgram;
    };

    window.WebCV = WebCV;
}(window, document)); // End closure

