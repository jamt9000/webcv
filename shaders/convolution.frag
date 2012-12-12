precision mediump float;
uniform sampler2D uSampler;
uniform mat3 uKernel;
uniform vec2 uImageSize; // for pixel based calculation
varying vec2 vTextureCoord; // from vertex shader
       
void main() {
    // to convert to pixel units
    vec2 px = vec2(1.0, 1.0) / uImageSize;
    // Two considerations: glsl matrices are column major,
    //                     gl coordinates origin is bottom left 

    vec3 neighbourSum = vec3(0.0,0.0,0.0);
    float totalSum = 0.0;

    for(int c=0; c<3; c++){
        for(int r=0; r<3; r++){
          vec2 offs = vec2(c-1,r-1) * px;
          float kernelVal = uKernel[c][r];
          neighbourSum += (texture2D(uSampler, vTextureCoord + offs) * kernelVal).rgb;
          totalSum += kernelVal;
        }
    }

    gl_FragColor = vec4(neighbourSum / totalSum, 1.0);
}