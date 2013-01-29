/*jslint es5: true, browser: true, devel: true */
/*global WebCV, Float32Array, Int32Array, Uint8Array, Int8Array, Uint16Array, Int16Array, Uint32Array, Int32Array */

(function (WebCV, window, document, undefined) {
    "use strict";

    var shaders = function () {
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

                gl.useProgram(shaderProgram);

                // Find all available uniforms
                uniforms = {};
                nUniforms = gl.getProgramParameter(shaderProgram, gl.ACTIVE_UNIFORMS);
                for (k = 0; k < nUniforms; k += 1) {
                    activeInfo = gl.getActiveUniform(shaderProgram, k);
                    // name value for arrays is like "thename[0]"
                    uniforms[activeInfo.name.split('[')[0]] = activeInfo;
                }

                for (opt in options) {
                    if (options.hasOwnProperty(opt)) {
                        if (typeof opt === "string") {
                            if (uniforms[opt] !== undefined) {
                                location = gl.getUniformLocation(shaderProgram, opt);
                                activeInfo = uniforms[opt];
                                val = options[opt];

                                if (typeof val === "number") {
                                    switch (activeInfo.type) {
                                    case gl.FLOAT:
                                        gl.uniform1f(location, val);
                                        break;
                                    case gl.INT:
                                        gl.uniform1i(location, val);
                                        break;
                                    case gl.SAMPLER_2D:
                                        gl.uniform1i(location, val);
                                        break;
                                    case gl.SAMPLER_CUBE:
                                        gl.uniform1i(location, val);
                                        break;
                                    }

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

                gl.useProgram(shaderProgram);

                if (attributes.length === 0) {
                    return;
                }

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

            renderShaderChain: function (shaders, uniforms, attributes, options) {
                var gl = this.core.gl,
                    i,
                    fb,
                    texture,
                    width,
                    height,
                    shadersLength,
                    uniformsLength,
                    attributesLength,
                    framebufferPoolLength,
                    texturePoolLength,
                    shader;

                if (uniforms === undefined) {
                    uniforms = [];
                }
                if (attributes === undefined) {
                    attributes = [];
                }
                if (options === undefined) {
                    options = {};
                }

                width = options.width || this.core.canvas.width;
                height = options.height || this.core.canvas.height;
                // Store framebuffers and textures for reuse
                if (this.framebufferPool === undefined) {
                    this.framebufferPool = [];
                    for (i = 0; i < 2; i += 1) {
                        fb = gl.createFramebuffer();
                        this.framebufferPool.push(fb);
                    }
                }
                if (this.texturePool === undefined) {
                    this.texturePool = [];
                    for (i = 0; i < 2; i += 1) {
                        texture = gl.createTexture();

                        this.texturePool.push(texture);
                    }
                }

                shadersLength = shaders.length;
                uniformsLength = uniforms.length;
                attributesLength = attributes.length;
                texturePoolLength = this.texturePool.length;
                framebufferPoolLength = this.framebufferPool.length;

                // Setup textures
                for (i = 0; i < texturePoolLength; i += 1) {
                    texture = this.texturePool[i];
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0,
                                  gl.RGBA, gl.UNSIGNED_BYTE, null);
                }

                gl.bindTexture(gl.TEXTURE_2D, options.initialTexture);

                for (i = 0; i < shadersLength; i += 1) {
                    shader = shaders[i];
                    // Cycle over the texture and framebuffer arrays
                    texture = this.texturePool[i % texturePoolLength];
                    fb = this.framebufferPool[i % framebufferPoolLength];

                    gl.useProgram(shader);

                    if (uniformsLength) {
                        this.setUniforms(shader, uniforms[i % uniformsLength]);
                    }

                    if (attributesLength) {
                        this.setAttributes(shader, attributes[i % attributesLength]);
                    }

                    // On intermediate passes render to framebuffer
                    if (i < shadersLength - 1) {
                        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
                        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                                                gl.TEXTURE_2D, texture, 0);

                        gl.viewport(0, 0, width, height);

                        gl.drawArrays(gl.TRIANGLES, 0, 6);

                        // Next use the texture just rendered to
                        gl.bindTexture(gl.TEXTURE_2D, texture);
                    } else {
                        // Final pass render to canvas
                        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                        gl.viewport(0, 0, width, height);

                        gl.drawArrays(gl.TRIANGLES, 0, 6);
                    }
                }
            },

            /**
             * If one name is provided, first try to find vertex and fragment shader with same name, otherwise
             * use default draw2d vertex shader
             * If two names, first is vertex shader, second is fragment shader
             */
            getNamedShader: function (name1, name2, params) {
                var source,
                    vertSource,
                    fragSource,
                    defines,
                    d,
                    definesString;

                // Allow for only 1 name

                if (typeof name2 !== "string") {
                    params = name2;
                    name2 = undefined;
                }

                params = params || {};

                if (name2 === undefined) {
                    if (WebCV.SHADERSOURCE.fragment[name1] !== undefined) {
                        if (WebCV.SHADERSOURCE.vertex[name1] !== undefined) {
                            vertSource = WebCV.SHADERSOURCE.vertex[name1].join('\n');
                            fragSource = WebCV.SHADERSOURCE.fragment[name1].join('\n');
                        } else {
                            vertSource = WebCV.SHADERSOURCE.vertex.draw2d.join('\n');
                            fragSource = WebCV.SHADERSOURCE.fragment[name1].join('\n');
                        }
                    } else {
                        throw "No fragment shader with specified name";
                    }
                } else {
                    vertSource = WebCV.SHADERSOURCE.vertex[name1].join('\n');
                    fragSource = WebCV.SHADERSOURCE.fragment[name2].join('\n');
                }

                // Insert compile-time #defines

                if (params.defines) {
                    defines = params.defines;
                    definesString = "";

                    for (d in defines) {
                        if (defines.hasOwnProperty(d)) {
                            definesString += "#define " + d + " " + defines[d] + "\n";
                        }
                    }

                    vertSource = definesString + "\n" + vertSource;
                    fragSource = definesString + "\n" + fragSource;
                }



                return this.compileShaderProgram(vertSource, fragSource);
            }
        };
    };


    WebCV.registerModule("shaders", shaders);

}(WebCV, window, document));