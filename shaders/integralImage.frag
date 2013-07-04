precision highp float;
uniform sampler2D uSampler;
uniform vec2 uImageSize; // for pixel based calculation
uniform vec2 uResolution;
varying vec2 vTextureCoord; // from vertex shader
uniform float uPass;
       
void main() {

    vec4 colour = texture2D(uSampler, vTextureCoord);
    float grey;
    if(uPass == 1.) {
        grey = floor((floor(colour.r*255.) + floor(colour.g*255.) + floor(colour.b*255.))/3.);
        gl_FragColor = vec4(grey,grey,grey,grey);

    } else {
        grey = colour.r;
        gl_FragColor = vec4(grey,grey,grey,grey);
    }

    #ifdef DEBUG
    gl_FragColor = texture2D(uSampler, vTextureCoord) * vec4(1.,1.,1.,0.5);
    #endif
}
