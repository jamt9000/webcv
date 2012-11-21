// Start closure
(function (window) {

    "use strict";

    /**
     * The global WebCV object, which is a factory that returns a WebCV function
     * specific to a canvas element.
     */
    var WebCV = function (canvas) {
        // Self-invoking constructor
        if (!(this instanceof WebCV)) {
            return new WebCV(canvas);
        }

        this.canvas = canvas;

        // Get webgl context
        this.gl = null;

        try {
            this.gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        } catch (e) {
            alert("WebGL not available");
        }
    };


    /**
     * Utility function to create a video element
     * and add it to the document
     */
    WebCV.prototype.createVideoElement = function (src) {
        var video = document.createElement("video");
        video.src = src;
        video.style = "display:none;";
        document.body.appendChild(video);
    };


    /**
     * Wrapper around browser-specific getUserMedia functions
     */
    WebCV.prototype.getUserMedia = function (constraints, success, error) {
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
    };


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
    };


    var shaders = {
        defaultFragmentShader: "\
             precision mediump float;\
             varying vec2 vTextureCoord;\
             uniform sampler2D uSampler;\
             void main(void) {\
                 gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\
             }",
        defaultVertexShader: "\
            attribute vec3 aVertexPosition;\
            attribute vec2 aTextureCoord;\
            uniform mat4 uMVMatrix;\
            uniform mat4 uPMatrix;\
            \
            varying vec2 vTextureCoord;\
            \
            void main(void) {\
                 gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\
                 vTextureCoord = aTextureCoord;\
            }"};

    WebCV.prototype.compileShaderProgram = function (fragSource, vertSource) {
        var gl = this.gl,
            fragShader,
            vertShader,
            shaderProgram;

        fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragShader, fragSource);
        gl.compileShader(fragShader);

        if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
            console.log("Error compiling fragment shader: " + gl.getShaderInfoLog(fragShader));
            return null;
        }

        vertShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertShader, vertSource);
        gl.compileShader(vertShader);

        if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
            console.log("Error compiling vertex shader: " + gl.getShaderInfoLog(vertShader));
            return null;
        }

        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertShader);
        gl.attachShader(shaderProgram, fragShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.log("Error linking shader program.");
        }
        //gl.useProgram(shaderProgram);

        return shaderProgram;
    }

    WebCV.prototype.setCurrentShader = function (shaderProgram) {
        var gl = this.gl;
        gl.useProgram(shaderProgram);
        gl.webcv_currentShader = shaderProgram;
    }

    WebCV.prototype.Cube = function (params) {
        var gl = this.gl,
            vertices,
            texCoords,
            vertexIndices,
            verticesBuf,
            texCoordsBuf,
            vertexIndicesBuf;
        
        this.texture = params["texture"] || null;

        this.vertices = [
            // Front face
            -1.0, -1.0,  1.0,
            1.0, -1.0,  1.0,
            1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,
            // Back face
            -1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,
            1.0,  1.0, -1.0,
            1.0, -1.0, -1.0,
            // Top face
            -1.0,  1.0, -1.0,
            -1.0,  1.0,  1.0,
            1.0,  1.0,  1.0,
            1.0,  1.0, -1.0,
            // Bottom face
            -1.0, -1.0, -1.0,
            1.0, -1.0, -1.0,
            1.0, -1.0,  1.0,
            -1.0, -1.0,  1.0,
            // Right face
            1.0, -1.0, -1.0,
            1.0,  1.0, -1.0,
            1.0,  1.0,  1.0,
            1.0, -1.0,  1.0,
            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,
            -1.0,  1.0,  1.0,
            -1.0,  1.0, -1.0];

        this.texCoords = [
            // Front
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Back
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Top
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Bottom
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Right
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Left
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0];

        // Indices into vertex array specifying 2 triangles per face
        this.vertexIndices = [
            0,  1,  2,      0,  2,  3,    // front
            4,  5,  6,      4,  6,  7,    // back
            8,  9,  10,     8,  10, 11,   // top
            12, 13, 14,     12, 14, 15,   // bottom
            16, 17, 18,     16, 18, 19,   // right
            20, 21, 22,     20, 22, 23    // left
            ];

        this.initBuffers = function(){
            verticesBuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

            texCoordsBuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.texCoords), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            vertexIndicesBuf = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndicesBuf);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.vertexIndices), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        };

        this.draw = function() {
            var shader = gl.webcv_currentShader,
                vertexPositionAttribute,
                textureCoordAttribute;

            // Set up buffers
            gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuf);

            vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
            gl.enableVertexAttribArray(vertexPositionAttribute);

            textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
            gl.enableVertexAttribArray(textureCoordAttribute);

            gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuf);
            gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, vertexIndicesBuf);
            gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndicesBuf);
            // Draw cube
            gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
        };
    };

    WebCV.prototype.renderToFrameBuffer = function (input, output, shaderProgram) {
    
    };

    window.WebCV = WebCV;

}(window)); // End closure

/*jslint es5: true, browser: true, devel: true */
