/*jslint es5: true, browser: true, devel: true */
/*global WebCV */

(function (WebCV, window, document, undefined) {
    "use strict";

    

    var shaderSource = {
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

    var shaders = function () {
        return {
            compileShaderProgram: function (vertSource, fragSource) {
                var core = this.core,
                    gl = core.gl,
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
                    nAttributes,
                    attributes,
                    k,
                    activeInfo,
                    location;

                if (typeof options !== "undefined") {
                    // Find all available uniforms
                    uniforms = {};
                    nUniforms = gl.getProgramParameter(s,gl.ACTIVE_UNIFORMS);
                    for(k = 0; k < nUniforms; k+=1){
                        activeInfo = gl.getActiveUniform(shaderProgram,k);
                        uniforms[activeInfo.name] = activeInfo;
                    }

                    for (opt in options) {
                        if (options.hasOwnProperty(opt)) {
                            if (typeof opt === "string") {
                                if (opt in uniforms){
                                    location = gl.getUniformLocation(shaderProgram, opt);
                                    activeInfo = uniforms[opt];
                                    val = options[opt];

                                    if (val instanceof Array) {
                                        switch (activeInfo.type) {
                                            case gl.FLOAT: gl.uniform1fv(location, new Float32Array(val)); break;
                                            case gl.FLOAT_VEC2: gl.uniform2fv(location, new Float32Array(val)); break;
                                            case gl.FLOAT_VEC3: gl.uniform3fv(location, new Float32Array(val)); break;
                                            case gl.FLOAT_VEC4: gl.uniform4fv(location, new Float32Array(val)); break;
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
                }
            },

            getNamedShader: function (name) {
                var source,
                    vertSource,
                    fragSource;

                source = shaderSource[name];

                vertSource = source.vertex.join('\n');
                fragSource = source.fragment.join('\n');
                console.log(fragSource);

                return this.compileShaderProgram(vertSource, fragSource);
            }
        };
    };


    WebCV.registerModule("shaders", shaders);

}(WebCV, window, document));
