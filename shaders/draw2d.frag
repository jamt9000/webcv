uniform sampler2D uSampler;
uniform vec2 uImageSize; // for pixel based calculation
varying vec2 vTextureCoord; // from vertex shader
       
void main() {
    // to convert to pixel units
    //vec2 px = vec2(1.0, 1.0) / uImageSize;
    gl_FragColor = texture2D(uSampler, vTextureCoord);
    //gl_FragColor = vec4(vTextureCoord, 1.0, 1.0);
}
