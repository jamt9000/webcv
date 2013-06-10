precision highp float;
uniform sampler2D uSampler;
uniform vec2 uIntegralImageSize;

#define integralCoord(v)  ((v)/uIntegralImageSize)
       
void main() {
    float integralVal = texture2D(uSampler, integralCoord(gl_FragCoord.xy)).x;

    // 2**16 = 65536
    // 2**8 = 256
    
    float byte1 = floor(integralVal/65536.);
    float byte2 = floor((integralVal - (byte1 * 65536.))/256.);
    float byte3 = floor((integralVal - floor(integralVal/256.) * 256.));
    
    gl_FragColor = vec4(float(byte1)/255.,float(byte2)/255.,float(byte3)/255., 1.0);
    //float dbg = float(texture2D(uSampler, integralCoord(gl_FragCoord.xy)).x > 1500000.0);
    //gl_FragColor = vec4(dbg, 0.0, 0.0, 1.0);
    
}
