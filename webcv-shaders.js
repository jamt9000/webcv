/*jslint es5: true, browser: true, devel: true */
/*global WebCV, Float32Array, Int32Array */

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
                "    // convert pixel coords to range -1,1",
                "    vec2 normCoords = ((aPosition/uResolution) * 2.0) -1.0;",
                "    gl_Position = vec4(normCoords, 0, 1);",
                "    // pass aTextureCoord to fragment shader unchanged",
                "   vTextureCoord = aTextureCoord;",
                "}"
            ],
            fragment: [
                "precision mediump float;",
                "uniform sampler2D uSampler;",
                "varying vec2 vTextureCoord; // from vertex shader",
                "void main() {",
                "    gl_FragColor = texture2D(uSampler, vTextureCoord);",
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
                    val;

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
                                    gl.uniform1f(location, val)
                                } else {
                                    switch (activeInfo.type) {
                                    case gl.FLOAT: gl.uniform1fv(location, new Float32Array(val)); break;
                                    case gl.FLOAT_VEC2: gl.uniform2fv(location, new Float32Array(val)); break;
                                    case gl.FLOAT_VEC3: gl.uniform3fv(location, new Float32Array(val)); break;
                                    case gl.FLOAT_VEC4: gl.uniform4fv(location, new Float32Array(val)); break;
                                    case gl.FLOAT_MAT2: uniformMatrix2fv(location, true, new Float32Array(val)); break;
                                    case gl.FLOAT_MAT3: uniformMatrix3fv(location, true, new Float32Array(val)); break;
                                    case gl.FLOAT_MAT4: uniformMatrix4fv(location, true, new Float32Array(val)); break;
                                    case gl.INT:      gl.uniform1iv(location, new Int32Array(val)); break;
                                    case gl.INT_VEC2: gl.uniform2iv(location, new Int32Array(val)); break;
                                    case gl.INT_VEC3: gl.uniform3iv(location, new Int32Array(val)); break;
                                    case gl.INT_VEC4: gl.uniform4iv(location, new Int32Array(val)); break;
                                    case gl.BOOL:      gl.uniform1iv(location, new Int32Array(val)); break;   
                                    case gl.BOOL_VEC2: gl.uniform2iv(location, new Int32Array(val)); break;
                                    case gl.BOOL_VEC3: gl.uniform3iv(location, new Int32Array(val)); break;
                                    case gl.BOOL_VEC4: gl.uniform4iv(location, new Int32Array(val)); break;
                                    case gl.SAMPLER_2D:  gl.uniform1iv(location, new Int32Array(val)); break;   
                                    case gl.SAMPLER_CUBE:  gl.uniform1iv(location, new Int32Array(val)); break;   
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
                    attributes,
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
                        if (Object.prototype.toString.call(buffer) !== '[object WebGLBuffer]'){
                            console.log("Creating new buffer");
                            buffer = this.arrayBuffer(buffer);
                        }

                        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

                        // Allowed data types: BYTE, UNSIGNED_BYTE, SHORT, UNSIGNED_SHORT, FLOAT
                        // Allowed GLSL attribute sizes: float, vec2, vec3, vec4, mat2, mat3, and mat4 (all float)

                        // use components per attribute from attribute's activeInfo
                        // use data type stored on buffer if available
                        dataType = buffer.webcv_dataType || gl.FLOAT;

                        gl.vertexAttribPointer(location, activeInfo.size, dataType, false, 0, 0);

                        gl.enableVertexAttribArray(location);
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
                    case Float32Array: dataType = gl.FLOAT; break;
                    case Uint8Array: dataType = gl.UNSIGNED_BYTE; break;
                    case Int8Array: dataType = gl.BYTE; break;
                    case Uint16Array: dataType = gl.UNSIGNED_SHORT; break;
                    case Int16Array: dataType = gl.SHORT; break;
                    case Uint32Array: dataType = gl.UNSIGNED_INT; break;
                    case Int32Array: dataType = gl.INT; break;
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
            }
        };
    };


    WebCV.registerModule("shaders", shaders);

}(WebCV, window, document));
