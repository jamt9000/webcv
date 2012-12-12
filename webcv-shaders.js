/*jslint es5: true, browser: true, devel: true */
/*global WebCV, Float32Array, Int32Array, Uint8Array, Int8Array, Uint16Array, Int16Array, Uint32Array, Int32Array */

(function (WebCV, window, document, undefined) {
    "use strict";

    var shaderSource,
        shaders;

    shaderSource = {
        draw2d: {
            vertex: [
                "// Uniforms - same for all vertices",
                "uniform vec2 uResolution;",

                "//Attributes - vertex-specific",
                "attribute vec2 aPosition;",
                "attribute vec2 aTextureCoord;",

                "// Varyings - for passing data to fragment shader",
                "varying vec2 vTextureCoord;",

                "void main() {",
                "   // convert pixel coords to range -1,1",
                "   vec2 normCoords = ((aPosition/uResolution) * 2.0) -1.0;",
                "   gl_Position = vec4(normCoords, 0, 1);",
                "   // pass aTextureCoord to fragment shader unchanged",
                "   vTextureCoord = aTextureCoord;",
                "}"
            ],
            fragment: [
                "precision mediump float;",
                "uniform sampler2D uSampler;",
                "varying vec2 vTextureCoord; // from vertex shader",
                "void main() {",
                "   gl_FragColor = texture2D(uSampler, vTextureCoord);",
                "}"
            ]
        },
        convolution: {
            vertex: [
                "uniform vec2 uResolution;",
                "attribute vec2 aPosition;",
                "attribute vec2 aTextureCoord;",
                "varying vec2 vTextureCoord;",
                "void main () {",
                "   vec2 normCoords = ((aPosition/uResolution) * 2.0) -1.0;",
                "   gl_Position = vec4(normCoords, 0, 1);",
                "   vTextureCoord = aTextureCoord;",
                "}"
            ],
            fragment: [
                "precision mediump float;",
                "uniform sampler2D uSampler;",
                "uniform mat3 uKernel;",
                "uniform vec2 uImageSize; // for pixel based calculation",
                "varying vec2 vTextureCoord; // from vertex shader",
                "void main() {",
                "    // to convert to pixel units",
                "    vec2 px = vec2(1.0, 1.0) / uImageSize;",
                "    // Two considerations: glsl matrices are column major,",
                "    //                     gl coordinates origin is bottom left",
                "    vec3 neighbourSum = vec3(0.0, 0.0, 0.0);",
                "    float totalSum = 0.0;",
                "    for(int c=0; c<3; c++){",
                "        for(int r=0; r<3; r++){",
                "          vec2 offs = vec2(c-1,r-1) * px;",
                "          float kernelVal = uKernel[c][r];",
                "          neighbourSum += (texture2D(uSampler, vTextureCoord + offs) * kernelVal).rgb;",
                "          totalSum += kernelVal;",
                "        }",
                "    }",
                "    gl_FragColor = vec4(neighbourSum / totalSum, 1.0);",
                "}"
            ]
        },

        sobelEdge: {
            vertex: [
                "uniform vec2 uResolution;",
                "attribute vec2 aPosition;",
                "attribute vec2 aTextureCoord;",
                "varying vec2 vTextureCoord;",
                "void main () {",
                "   vec2 normCoords = ((aPosition/uResolution) * 2.0) -1.0;",
                "   gl_Position = vec4(normCoords, 0, 1);",
                "   vTextureCoord = aTextureCoord;",
                "}"
            ],
            fragment: [
                "precision mediump float;",
                "uniform sampler2D uSampler;",
                "uniform mat3 uKernel;",
                "uniform vec2 uImageSize; // for pixel based calculation",
                "varying vec2 vTextureCoord; // from vertex shader",
                "void main() {",
                "    // to convert to pixel units",
                "    vec2 px = vec2(1.0, 1.0) / uImageSize;",
                "    float thresh = 0.0;",
                "    float neighbourSum = 0.0;",
                "    mat3 sobelX = mat3(-1,-2,-1,0,0,0,1,2,1);",
                "    mat3 sobelY = mat3(-1,0,1,-2,0,2,-1,0,1);",
                "    for(int c=0; c<3; c++){",
                "        for(int r=0; r<3; r++){",
                "          vec2 offs = vec2(c-1,r-1) * px;",
                "          float kernelVal = sobelX[c][r];",
                "          vec4 colour = texture2D(uSampler, vTextureCoord + offs);",
                "          float grey = 0.299 * colour.r + 0.587 * colour.g + 0.114 * colour.b;",
                "          neighbourSum += grey * kernelVal;",
                "        }",
                "    }",
                "    float valueX = neighbourSum;",
                "    for(int c=0; c<3; c++){",
                "        for(int r=0; r<3; r++){",
                "          vec2 offs = vec2(c-1,r-1) * px;",
                "          float kernelVal = sobelY[c][r];",
                "          vec4 colour = texture2D(uSampler, vTextureCoord + offs);",
                "          float grey = 0.299 * colour.r + 0.587 * colour.g + 0.114 * colour.b;",
                "          neighbourSum += grey * kernelVal;",
                "        }",
                "    }",
                "    float valueY = neighbourSum;",
                "    float res = length(vec2(valueX, valueY));",
                "    if(res < thresh){",
                "      res = 0.0;",
                "    }",
                "    gl_FragColor = vec4(res, res, res, 1.0);",
                "}"
            ]


        },

        sobelEdgeHighlight: {
            vertex: [
                "uniform vec2 uResolution;",
                "attribute vec2 aPosition;",
                "attribute vec2 aTextureCoord;",
                "varying vec2 vTextureCoord;",
                "void main () {",
                "   vec2 normCoords = ((aPosition/uResolution) * 2.0) -1.0;",
                "   gl_Position = vec4(normCoords, 0, 1);",
                "   vTextureCoord = aTextureCoord;",
                "}"
            ],
            fragment: [
                "precision mediump float;",
                "uniform sampler2D uSampler;",
                "uniform mat3 uKernel;",
                "uniform vec2 uImageSize; // for pixel based calculation",
                "varying vec2 vTextureCoord; // from vertex shader",
                "void main() {",
                "    // to convert to pixel units",
                "    vec2 px = vec2(1.0, 1.0) / uImageSize;",
                "    float thresh = 0.15;",
                "    float neighbourSum = 0.0;",
                "    mat3 sobelX = mat3(-1,-2,-1,0,0,0,1,2,1);",
                "    mat3 sobelY = mat3(-1,0,1,-2,0,2,-1,0,1);",
                "    for(int c=0; c<3; c++){",
                "        for(int r=0; r<3; r++){",
                "          vec2 offs = vec2(c-1,r-1) * px;",
                "          float kernelVal = sobelX[c][r];",
                "          vec4 colour = texture2D(uSampler, vTextureCoord + offs);",
                "          float grey = 0.299 * colour.r + 0.587 * colour.g + 0.114 * colour.b;",
                "          neighbourSum += grey * kernelVal;",
                "        }",
                "    }",
                "    float valueX = neighbourSum;",
                "    for(int c=0; c<3; c++){",
                "        for(int r=0; r<3; r++){",
                "          vec2 offs = vec2(c-1,r-1) * px;",
                "          float kernelVal = sobelY[c][r];",
                "          vec4 colour = texture2D(uSampler, vTextureCoord + offs);",
                "          float grey = 0.299 * colour.r + 0.587 * colour.g + 0.114 * colour.b;",
                "          neighbourSum += grey * kernelVal;",
                "        }",
                "    }",
                "    float valueY = neighbourSum;",
                "    float res = length(vec2(valueX, valueY));",
                "    if(res < thresh){",
                "      res = 0.0;",
                "    }",
                "    res = 1.0 - res;",
                "    vec4 colour = texture2D(uSampler, vTextureCoord);",
                "    gl_FragColor = vec4( colour.r/res,colour.gba);",
                "}"
            ]
        },
        harris: {
            vertex: [
                "uniform vec2 uResolution;",
                "attribute vec2 aPosition;",
                "attribute vec2 aTextureCoord;",
                "varying vec2 vTextureCoord;",
                "void main () {",
                "   vec2 normCoords = ((aPosition/uResolution) * 2.0) -1.0;",
                "   gl_Position = vec4(normCoords, 0, 1);",
                "   vTextureCoord = aTextureCoord;",
                "}"
            ],
            fragment: [
                "precision mediump float;",
                "uniform sampler2D uSampler;",
                "uniform mat3 uKernel;",
                "uniform vec2 uImageSize; // for pixel based calculation",
                "varying vec2 vTextureCoord; // from vertex shader",
                "void main() {",
                "    // to convert to pixel units",
                "    vec2 px = vec2(1.0, 1.0) / uImageSize;",
                "    float thresh = 0.15;",
                "    float neighbourSum = 0.0;",
                "    mat3 sobelX = mat3(-1,-2,-1,0,0,0,1,2,1);",
                "    mat3 sobelY = mat3(-1,0,1,-2,0,2,-1,0,1);",
                "    for(int c=0; c<3; c++){",
                "        for(int r=0; r<3; r++){",
                "          vec2 offs = vec2(c-1,r-1) * px;",
                "          float kernelVal = sobelX[c][r];",
                "          vec4 colour = texture2D(uSampler, vTextureCoord + offs);",
                "          float grey = 0.299 * colour.r + 0.587 * colour.g + 0.114 * colour.b;",
                "          neighbourSum += grey * kernelVal;",
                "        }",
                "    }",
                "    float valueX = neighbourSum;",
                "    for(int c=0; c<3; c++){",
                "        for(int r=0; r<3; r++){",
                "          vec2 offs = vec2(c-1,r-1) * px;",
                "          float kernelVal = sobelY[c][r];",
                "          vec4 colour = texture2D(uSampler, vTextureCoord + offs);",
                "          float grey = 0.299 * colour.r + 0.587 * colour.g + 0.114 * colour.b;",
                "          neighbourSum += grey * kernelVal;",
                "        }",
                "    }",
                "    float valueY = neighbourSum;",
                "    float Ixx = valueX * valueX;",
                "    float Iyy = valueY * valueY;",
                "    float Ixy = valueX * valueY;",
                "    // Determinant and trace of the harris matrix",
                "    float det = Ixx * Iyy - Ixy * Ixy;",
                "    float trace = Ixx + Iyy;",
                "    // Reflect large eigenvalues",
                "    float res = 100000000.0 * det / trace;",
                "    if(res > 5.0){",
                "       gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);",
                "    } else if(res > 1.0){",
                "       gl_FragColor = vec4(0.0, 0.2 * res, 1.0, 1.0);",
                "    }",
                "    else{",
                "       gl_FragColor = vec4(0.0, 0.0, res, 1.0);",
                "    }",
                "}"
            ]
        }
    };

    shaders = function () {
        return {
            compileShaderProgram: function (vertSource, fragSource) {
                var core = this.core,
                    gl = this.core.gl,
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
                    console.log(gl.getProgramInfoLog(shaderProgram));
                }
                //gl.useProgram(shaderProgram);

                return shaderProgram;
            },

            setUniforms: function (shaderProgram, options) {
                var gl = this.core.gl,
                    opt,
                    nUniforms,
                    uniforms,
                    activeInfo,
                    location,
                    val,
                    k;

                // Find all available uniforms
                uniforms = {};
                nUniforms = gl.getProgramParameter(shaderProgram, gl.ACTIVE_UNIFORMS);
                for (k = 0; k < nUniforms; k += 1) {
                    activeInfo = gl.getActiveUniform(shaderProgram, k);
                    uniforms[activeInfo.name] = activeInfo;
                }

                for (opt in options) {
                    if (options.hasOwnProperty(opt)) {
                        if (typeof opt === "string") {
                            if (uniforms[opt] !== undefined) {
                                location = gl.getUniformLocation(shaderProgram, opt);
                                activeInfo = uniforms[opt];
                                val = options[opt];

                                if (val instanceof Number) {
                                    gl.uniform1f(location, val);
                                } else {
                                    // Monstruous switch statement to choose correct uniform function
                                    // based on the uniform's type
                                    switch (activeInfo.type) {
                                    case gl.FLOAT:
                                        gl.uniform1fv(location, new Float32Array(val));
                                        break;
                                    case gl.FLOAT_VEC2:
                                        gl.uniform2fv(location, new Float32Array(val));
                                        break;
                                    case gl.FLOAT_VEC3:
                                        gl.uniform3fv(location, new Float32Array(val));
                                        break;
                                    case gl.FLOAT_VEC4:
                                        gl.uniform4fv(location, new Float32Array(val));
                                        break;
                                    case gl.FLOAT_MAT2:
                                        gl.uniformMatrix2fv(location, false, new Float32Array(val));
                                        break;
                                    case gl.FLOAT_MAT3:
                                        gl.uniformMatrix3fv(location, false, new Float32Array(val));
                                        break;
                                    case gl.FLOAT_MAT4:
                                        gl.uniformMatrix4fv(location, false, new Float32Array(val));
                                        break;
                                    case gl.INT:
                                        gl.uniform1iv(location, new Int32Array(val));
                                        break;
                                    case gl.INT_VEC2:
                                        gl.uniform2iv(location, new Int32Array(val));
                                        break;
                                    case gl.INT_VEC3:
                                        gl.uniform3iv(location, new Int32Array(val));
                                        break;
                                    case gl.INT_VEC4:
                                        gl.uniform4iv(location, new Int32Array(val));
                                        break;
                                    case gl.BOOL:
                                        gl.uniform1iv(location, new Int32Array(val));
                                        break;
                                    case gl.BOOL_VEC2:
                                        gl.uniform2iv(location, new Int32Array(val));
                                        break;
                                    case gl.BOOL_VEC3:
                                        gl.uniform3iv(location, new Int32Array(val));
                                        break;
                                    case gl.BOOL_VEC4:
                                        gl.uniform4iv(location, new Int32Array(val));
                                        break;
                                    case gl.SAMPLER_2D:
                                        gl.uniform1iv(location, new Int32Array(val));
                                        break;
                                    case gl.SAMPLER_CUBE:
                                        gl.uniform1iv(location, new Int32Array(val));
                                        break;

                                    }
                                }
                            }
                        }
                    }
                }
            },

            setAttributes: function (shaderProgram, attributes) {
                var gl = this.core.gl,
                    location,
                    a,
                    buffer,
                    val,
                    nAttributes,
                    k,
                    activeInfo,
                    dataType,
                    availableAttrs;

                // Find all available attributes
                availableAttrs = {};
                nAttributes = gl.getProgramParameter(shaderProgram, gl.ACTIVE_ATTRIBUTES);
                for (k = 0; k < nAttributes; k += 1) {
                    activeInfo = gl.getActiveAttrib(shaderProgram, k);
                    availableAttrs[activeInfo.name] = activeInfo;
                }

                for (a in attributes) {
                    if (attributes.hasOwnProperty(a)) {
                        buffer = attributes[a];
                        location = gl.getAttribLocation(shaderProgram, a);
                        activeInfo = availableAttrs[a];

                        if (activeInfo === undefined) {
                            throw "Attribute not declared in shader";
                        }

                        // If passed a regular array or typed array, create a new buffer
                        if (Object.prototype.toString.call(buffer) !== '[object WebGLBuffer]') {
                            console.log("Creating new buffer");
                            buffer = this.arrayBuffer(buffer);
                        }

                        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

                        // Allowed data types: BYTE, UNSIGNED_BYTE, SHORT, UNSIGNED_SHORT, FLOAT
                        // Allowed GLSL attribute sizes: float, vec2, vec3, vec4, mat2, mat3, and mat4 (all float)

                        // use components per attribute from attribute's activeInfo
                        // use data type stored on buffer if available
                        dataType = buffer.webcv_dataType || gl.FLOAT;

                        gl.enableVertexAttribArray(location);

                        gl.vertexAttribPointer(location, /*XXX should be num elements per vertex */ 2, dataType, false, 0, 0);

                    }
                }
            },

            arrayBuffer: function (data) {
                var gl = this.core.gl,
                    buffer = gl.createBuffer(),
                    typedArray,
                    dataType;

                // Crazy way to check if array since instanceof doesn't
                // work across frames (including Firefox dev console)
                if (Object.prototype.toString.call(data) === '[object Array]') {
                    typedArray = new Float32Array(data);
                } else {
                    typedArray = data;
                }

                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.bufferData(gl.ARRAY_BUFFER, typedArray, gl.STATIC_DRAW);

                // Should probably use the toString method here, but might be slow
                switch (typedArray.constructor) {
                case Float32Array:
                    dataType = gl.FLOAT;
                    break;
                case Uint8Array:
                    dataType = gl.UNSIGNED_BYTE;
                    break;
                case Int8Array:
                    dataType = gl.BYTE;
                    break;
                case Uint16Array:
                    dataType = gl.UNSIGNED_SHORT;
                    break;
                case Int16Array:
                    dataType = gl.SHORT;
                    break;
                case Uint32Array:
                    dataType = gl.UNSIGNED_INT;
                    break;
                case Int32Array:
                    dataType = gl.INT;
                    break;
                }

                // Store array type on the buffer object
                buffer.webcv_dataType = dataType;

                return buffer;
            },


            getNamedShader: function (name) {
                var source,
                    vertSource,
                    fragSource;

                source = shaderSource[name];

                vertSource = source.vertex.join('\n');
                fragSource = source.fragment.join('\n');

                return this.compileShaderProgram(vertSource, fragSource);
            },

            uploadTexture: function (image, texture) {
                var gl = this.core.gl;

                if (texture === undefined) {
                    texture = gl.createTexture();
                }

                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

                return texture;
            }
        };
    };


    WebCV.registerModule("shaders", shaders);

}(WebCV, window, document));