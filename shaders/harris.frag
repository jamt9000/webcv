precision mediump float;
uniform sampler2D uSampler;
uniform mat3 uKernel;
uniform vec2 uImageSize; // for pixel based calculation
varying vec2 vTextureCoord; // from vertex shader
       
void main() {
    // to convert to pixel units
    vec2 px = vec2(1.0, 1.0) / uImageSize;

    mat3 sobelX = mat3(-1,-2,-1,0,0,0,1,2,1);
    mat3 sobelY = mat3(-1,0,1,-2,0,2,-1,0,1);

    float valueX = 0.0;

    for(int c=0; c<3; c++){
        for(int r=0; r<3; r++){
          vec2 offs = vec2(c-1,r-1) * px;
          float kernelVal = sobelX[c][r];
          vec4 colour = texture2D(uSampler, vTextureCoord + offs);
          float grey = 0.299 * colour.r + 0.587 * colour.g + 0.114 * colour.b;

          valueX += grey * kernelVal;
        }
    }

    float valueY = 0.0;

    for(int c=0; c<3; c++){
        for(int r=0; r<3; r++){
          vec2 offs = vec2(c-1,r-1) * px;
          float kernelVal = sobelY[c][r];
          vec4 colour = texture2D(uSampler, vTextureCoord + offs);
          float grey = 0.299 * colour.r + 0.587 * colour.g + 0.114 * colour.b;

          valueY += grey * kernelVal;
        }
    }

    float Ixx = valueX * valueX;
    float Iyy = valueY * valueY;
    float Ixy = valueX * valueY;

    // Determinant and trace of the harris matrix

    float det = Ixx * Iyy - Ixy * Ixy;
    float trace = Ixx + Iyy;

    // Reflect large eigenvalues
    float res = 10000000.0 * det / trace;
    if(res > 10.0){
        gl_FragColor = vec4(1.0, 0, 0, 1.0);
    } else if(res > 1.0){
        gl_FragColor = vec4(0, 0.2, 0.2, 1.0);
    }
    else{
       gl_FragColor = vec4(0.0, 0.0, res, 1.0);
    }
}