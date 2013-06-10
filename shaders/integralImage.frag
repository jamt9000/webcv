precision highp float;
uniform sampler2D uSampler;
uniform vec2 uImageSize; // for pixel based calculation
uniform vec2 uResolution;
varying vec2 vTextureCoord; // from vertex shader
       
void main() {
    //gl_FragColor = texture2D(uSampler, vTextureCoord) * vec4(1.,1.,1.,0.5);
    vec4 colour = texture2D(uSampler, vTextureCoord);
    float grey = floor((colour.r*255. + colour.g*255. + colour.b*255.)/3.);
    gl_FragColor = vec4(grey,grey,grey,grey)/3.;
}
