WebCV.SHADERSOURCE = {
    "fragment": {
        "draw2d_test": [
            "uniform sampler2D uSampler;", 
            "uniform vec2 uImageSize; // for pixel based calculation", 
            "varying vec2 vTextureCoord; // from vertex shader", 
            "", 
            "void main() {", 
            "    // to convert to pixel units", 
            "    //vec2 px = vec2(1.0, 1.0) / uImageSize;", 
            "    gl_FragColor = texture2D(uSampler, vTextureCoord);", 
            "    //gl_FragColor = vec4(float(vTextureCoord.y > 0.9), 0.0, 1.0, 1.0);", 
            "}"
        ], 
        "draw2d": [
            "uniform sampler2D uSampler;", 
            "uniform vec2 uImageSize; // for pixel based calculation", 
            "varying vec2 vTextureCoord; // from vertex shader", 
            "", 
            "void main() {", 
            "    // to convert to pixel units", 
            "    //vec2 px = vec2(1.0, 1.0) / uImageSize;", 
            "    gl_FragColor = texture2D(uSampler, vTextureCoord);", 
            "    //gl_FragColor = vec4(vTextureCoord, 1.0, 1.0);", 
            "}"
        ], 
        "convolution": [
            "precision mediump float;", 
            "uniform sampler2D uSampler;", 
            "uniform mat3 uKernel;", 
            "uniform vec2 uImageSize; // for pixel based calculation", 
            "varying vec2 vTextureCoord; // from vertex shader", 
            "", 
            "void main() {", 
            "    // to convert to pixel units", 
            "    vec2 px = vec2(1.0, 1.0) / uImageSize;", 
            "    // Two considerations: glsl matrices are column major,", 
            "    //                     gl coordinates origin is bottom left", 
            "", 
            "    vec3 neighbourSum = vec3(0.0,0.0,0.0);", 
            "    float totalSum = 0.0;", 
            "", 
            "    for(int c=0; c<3; c++){", 
            "        for(int r=0; r<3; r++){", 
            "          vec2 offs = vec2(c-1,r-1) * px;", 
            "          float kernelVal = uKernel[c][r];", 
            "          neighbourSum += (texture2D(uSampler, vTextureCoord + offs) * kernelVal).rgb;", 
            "          totalSum += kernelVal;", 
            "        }", 
            "    }", 
            "", 
            "    gl_FragColor = vec4(neighbourSum / totalSum, 1.0);", 
            "}"
        ], 
        "sobelDerivatives": [
            "precision mediump float;", 
            "uniform sampler2D uSampler;", 
            "uniform mat3 uKernel;", 
            "uniform vec2 uImageSize; // for pixel based calculation", 
            "varying vec2 vTextureCoord; // from vertex shader", 
            "", 
            "void main() {", 
            "    // to convert to pixel units", 
            "    vec2 px = vec2(1.0, 1.0) / uImageSize;", 
            "", 
            "    mat3 sobelX = mat3(-1,-2,-1,0,0,0,1,2,1);", 
            "    mat3 sobelY = mat3(-1,0,1,-2,0,2,-1,0,1);", 
            "", 
            "    float valueX = 0.0;", 
            "", 
            "    for(int c=0; c<3; c++){", 
            "        for(int r=0; r<3; r++){", 
            "          vec2 offs = vec2(c-1,r-1) * px;", 
            "          float kernelVal = sobelX[c][r];", 
            "          vec4 colour = texture2D(uSampler, vTextureCoord + offs);", 
            "          float grey = 0.299 * colour.r + 0.587 * colour.g + 0.114 * colour.b;", 
            "", 
            "          valueX += grey * kernelVal;", 
            "        }", 
            "    }", 
            "", 
            "    float valueY = 0.0;", 
            "", 
            "    for(int c=0; c<3; c++){", 
            "        for(int r=0; r<3; r++){", 
            "          vec2 offs = vec2(c-1,r-1) * px;", 
            "          float kernelVal = sobelY[c][r];", 
            "          vec4 colour = texture2D(uSampler, vTextureCoord + offs);", 
            "          float grey = 0.299 * colour.r + 0.587 * colour.g + 0.114 * colour.b;", 
            "", 
            "          valueY += grey * kernelVal;", 
            "        }", 
            "    }", 
            "", 
            "    gl_FragColor = vec4(valueX * valueX, valueY * valueY, valueX * valueY, 1.0);", 
            "}"
        ], 
        "sobelEdgeHighlight": [
            "precision mediump float;", 
            "uniform sampler2D uSampler;", 
            "uniform mat3 uKernel;", 
            "uniform vec2 uImageSize; // for pixel based calculation", 
            "varying vec2 vTextureCoord; // from vertex shader", 
            "", 
            "void main() {", 
            "    // to convert to pixel units", 
            "    vec2 px = vec2(1.0, 1.0) / uImageSize;", 
            "", 
            "    float thresh = 0.15;", 
            "", 
            "    mat3 sobelX = mat3(-1,-2,-1,0,0,0,1,2,1);", 
            "    mat3 sobelY = mat3(-1,0,1,-2,0,2,-1,0,1);", 
            "", 
            "    float valueX = 0.0;", 
            "", 
            "    for(int c=0; c<3; c++){", 
            "        for(int r=0; r<3; r++){", 
            "          vec2 offs = vec2(c-1,r-1) * px;", 
            "          float kernelVal = sobelX[c][r];", 
            "          vec4 colour = texture2D(uSampler, vTextureCoord + offs);", 
            "          float grey = 0.299 * colour.r + 0.587 * colour.g + 0.114 * colour.b;", 
            "", 
            "          valueX += grey * kernelVal;", 
            "        }", 
            "    }", 
            "", 
            "    float valueY = 0.0;", 
            "", 
            "    for(int c=0; c<3; c++){", 
            "        for(int r=0; r<3; r++){", 
            "          vec2 offs = vec2(c-1,r-1) * px;", 
            "          float kernelVal = sobelY[c][r];", 
            "          vec4 colour = texture2D(uSampler, vTextureCoord + offs);", 
            "          float grey = 0.299 * colour.r + 0.587 * colour.g + 0.114 * colour.b;", 
            "", 
            "          valueY += grey * kernelVal;", 
            "        }", 
            "    }", 
            "", 
            "    float res = length(vec2(valueX, valueY));", 
            "", 
            "    if(res < thresh){", 
            "      res = 0.0;", 
            "    }", 
            "    res = 1.0 - res;", 
            "    vec4 colour = texture2D(uSampler, vTextureCoord);", 
            "    gl_FragColor = vec4( colour.r/res,colour.gba);", 
            "}"
        ], 
        "harris": [
            "precision mediump float;", 
            "uniform sampler2D uSampler;", 
            "uniform mat3 uKernel;", 
            "uniform vec2 uImageSize; // for pixel based calculation", 
            "varying vec2 vTextureCoord; // from vertex shader", 
            "", 
            "void main() {", 
            "    // to convert to pixel units", 
            "    vec2 px = vec2(1.0, 1.0) / uImageSize;", 
            "", 
            "    mat3 sobelX = mat3(-1,-2,-1,0,0,0,1,2,1);", 
            "    mat3 sobelY = mat3(-1,0,1,-2,0,2,-1,0,1);", 
            "", 
            "    float valueX = 0.0;", 
            "", 
            "    for(int c=0; c<3; c++){", 
            "        for(int r=0; r<3; r++){", 
            "          vec2 offs = vec2(c-1,r-1) * px;", 
            "          float kernelVal = sobelX[c][r];", 
            "          vec4 colour = texture2D(uSampler, vTextureCoord + offs);", 
            "          float grey = 0.299 * colour.r + 0.587 * colour.g + 0.114 * colour.b;", 
            "", 
            "          valueX += grey * kernelVal;", 
            "        }", 
            "    }", 
            "", 
            "    float valueY = 0.0;", 
            "", 
            "    for(int c=0; c<3; c++){", 
            "        for(int r=0; r<3; r++){", 
            "          vec2 offs = vec2(c-1,r-1) * px;", 
            "          float kernelVal = sobelY[c][r];", 
            "          vec4 colour = texture2D(uSampler, vTextureCoord + offs);", 
            "          float grey = 0.299 * colour.r + 0.587 * colour.g + 0.114 * colour.b;", 
            "", 
            "          valueY += grey * kernelVal;", 
            "        }", 
            "    }", 
            "", 
            "    float Ixx = valueX * valueX;", 
            "    float Iyy = valueY * valueY;", 
            "    float Ixy = valueX * valueY;", 
            "", 
            "    // Determinant and trace of the harris matrix", 
            "", 
            "    float det = Ixx * Iyy - Ixy * Ixy;", 
            "    float trace = Ixx + Iyy;", 
            "", 
            "    // Reflect large eigenvalues", 
            "    float res = 10000000.0 * det / trace;", 
            "    if(res > 10.0){", 
            "        gl_FragColor = vec4(1.0, 0, 0, 1.0);", 
            "    } else if(res > 1.0){", 
            "        gl_FragColor = vec4(0, 0.2, 0.2, 1.0);", 
            "    }", 
            "    else{", 
            "       gl_FragColor = vec4(0.0, 0.0, res, 1.0);", 
            "    }", 
            "}"
        ], 
        "lbpStage": [
            "precision mediump float;", 
            "uniform sampler2D uSampler;", 
            "uniform sampler2D lbpLookupTexture;", 
            "uniform sampler2D activeWindows;", 
            "", 
            "uniform vec2 uImageSize; // for pixel based calculation", 
            "varying vec2 vTextureCoord; // from vertex shader", 
            "", 
            "// The maximum number of weak classifiers in a stage", 
            "//#define NWEAK 3", 
            "//#define STAGEN 0", 
            "#define WINSIZE 24.0", 
            "", 
            "uniform vec2 leafValues[NWEAK];", 
            "uniform vec4 featureRectangles[NWEAK];", 
            "uniform float stageThreshold;", 
            "uniform vec2 lbpLookupTableSize;", 
            "uniform float scale;", 
            "uniform int scaleN;", 
            "", 
            "// round for positive numbers only", 
            "#define round_pos(x) floor(x+0.5)", 
            "", 
            "void main() {", 
            "  // to convert from pixel [0,w) to texture coordinates [0,1)", 
            "  vec2 px = vec2(1.0, 1.0) / uImageSize;", 
            "  vec2 halfpx = 0.5 * px;", 
            "", 
            "", 
            "  float sumStage = 0.0;", 
            "", 
            "  int lbp;", 
            "  float dbg = 1.0;", 
            "", 
            "  vec2 pos = gl_FragCoord.xy/uImageSize;", 
            "  float posx = pos.x;", 
            "  float posy = pos.y;", 
            "", 
            "  bool acceptedFromPreviousStage;", 
            "", 
            "  #if STAGEN > 0", 
            "  acceptedFromPreviousStage = texture2D(activeWindows, vec2(posx, posy)).x > 0.0;", 
            "  #else", 
            "  acceptedFromPreviousStage = true;", 
            "  #endif", 
            "", 
            "", 
            "  if (acceptedFromPreviousStage) {", 
            "    //const int w = 1;", 
            "    for(int w = 0; w < NWEAK; w++) {", 
            "      vec4 rect = featureRectangles[w];", 
            "", 
            "      #ifdef DEBUG_SHOWIMG", 
            "      rect.x = 0.0;", 
            "      rect.y = 0.0;", 
            "      rect.z = 1.0;", 
            "      rect.w = 1.0;", 
            "      #endif", 
            "", 
            "      float rx = round_pos(scale * rect.x) * px.x;", 
            "      float ry = round_pos(scale * rect.y) * px.y;", 
            "      float rw = round_pos(scale * rect.z) * px.x;", 
            "      float rh = round_pos(scale * rect.w) * px.y;", 
            "", 
            "", 
            "      // Top left quadrant", 
            "      float p0 = texture2D(uSampler, vec2(posx + rx, posy + ry)).x;  // top left point", 
            "      float p1 = texture2D(uSampler, vec2(posx + rx + rw, posy + ry)).x; // top right pt", 
            "      float p2 = texture2D(uSampler, vec2(posx + rx, posy + (ry + rh))).x; // bottom left pt", 
            "      float p3 = texture2D(uSampler, vec2(posx + rx + rw, posy + (ry + rh))).x; // bottom right", 
            "", 
            "      // Top right quadrant", 
            "      rx += 2.0 * rw;", 
            "      float p4 = texture2D(uSampler, vec2(posx + rx, posy + ry)).x;  // top left point", 
            "      float p5 = texture2D(uSampler, vec2(posx + rx + rw, posy + ry)).x; // top right pt", 
            "      float p6 = texture2D(uSampler, vec2(posx + rx, posy + ry + rh)).x; // bottom left pt", 
            "      float p7 = texture2D(uSampler, vec2(posx + rx + rw, posy + ry + rh)).x; // bottom right", 
            "", 
            "      // Bottom right quadrant", 
            "      ry += 2.0 * rh;", 
            "      float p8 = texture2D(uSampler, vec2(posx + rx, posy + ry)).x;  // top left point", 
            "      float p9 = texture2D(uSampler, vec2(posx + rx + rw, posy + ry)).x; // top right pt", 
            "      float p10 = texture2D(uSampler, vec2(posx + rx, posy + ry + rh)).x; // bottom left pt", 
            "      float p11 = texture2D(uSampler, vec2(posx + rx + rw, posy + ry + rh)).x; // bottom right", 
            "", 
            "      // Bottom left quadrant", 
            "      rx -= 2.0 * rw;", 
            "      float p12 = texture2D(uSampler, vec2(posx + rx, posy + ry)).x;  // top left point", 
            "      float p13 = texture2D(uSampler, vec2(posx + rx + rw, posy + ry)).x; // top right pt", 
            "      float p14 = texture2D(uSampler, vec2(posx + rx, posy + ry + rh)).x; // bottom left pt", 
            "      float p15 = texture2D(uSampler, vec2(posx + rx + rw, posy + ry + rh)).x; // bottom right", 
            "", 
            "      float c = p8 - p6 - p13 + p3;", 
            "", 
            "      float r0 = p3 - p2 - p1 + p0;", 
            "      float r1 = p6 - p4 - p3 + p1;", 
            "      float r2 = p7 - p5 - p6 + p4;", 
            "      float r3 = p9 - p7 - p8 + p6;", 
            "      float r4 = p11 - p9 - p10 + p8;", 
            "      float r5 = p10 - p8 - p15 + p13;", 
            "      float r6 = p15 - p13 - p14 + p12;", 
            "      float r7 = p13 - p3 - p12 + p2;", 
            "", 
            "      #ifdef DEBUG_SHOWIMG", 
            "      dbg = r0;", 
            "      break;", 
            "      #endif", 
            "", 
            "      lbp = (int(r0 > c) * 128) + (int(r1 > c) * 64) + (int(r2 > c) * 32) + (int(r3 > c) * 16) + (int(r4 > c) * 8) + (int(r5 > c) * 4) + (int(r6 > c) * 2) + int(r7 > c);", 
            "", 
            "      // +0.5 to the numerator to get the pixel centre (since the texture coordinates give the bottom left of pixel)", 
            "", 
            "      float lookup_x = (float(256 * w + lbp) + 0.5)/(lbpLookupTableSize.x); //float((256 * w + lbp)) / (lbpLookupTableSize.x);", 
            "      float lookup_y = (float(STAGEN) + 0.5)/ (lbpLookupTableSize.y);", 
            "", 
            "      float bit = texture2D(lbpLookupTexture, vec2(lookup_x, lookup_y)).x;", 
            "", 
            "      sumStage += bit * leafValues[w].x + (1.0 - bit) * leafValues[w].y;", 
            "", 
            "      //if(w == 1) {", 
            "        // LBP image:", 
            "        //dbg = float(lbp)/255.0;", 
            "        //dbg = float(bit);", 
            "      //}", 
            "", 
            "    }", 
            "", 
            "    float accepted = float(sumStage > stageThreshold);", 
            "", 
            "    #ifdef SCALES_SAME_TEXTURE", 
            "    float acceptedScale  = accepted * float(scaleN)/256.0;", 
            "    #endif", 
            "", 
            "    gl_FragColor = vec4(acceptedScale, accepted, accepted, 1.0);", 
            "", 
            "  } else {", 
            "    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);", 
            "  }", 
            "", 
            "", 
            "#ifdef DEBUG_INTEGRAL", 
            "    dbg = float(texture2D(uSampler, vec2(posx, posy)).x > 1500000.0);", 
            "    gl_FragColor = vec4(dbg, 0.0, 0.0, 1.0);", 
            "#endif", 
            "", 
            "", 
            "#ifdef DEBUG_SHOWIMG", 
            "    gl_FragColor = vec4(dbg/256.0, 0.0, 0.0, 1.0);", 
            "#endif", 
            "", 
            "}"
        ], 
        "sobelEdge": [
            "precision mediump float;", 
            "uniform sampler2D uSampler;", 
            "uniform mat3 uKernel;", 
            "uniform vec2 uImageSize; // for pixel based calculation", 
            "varying vec2 vTextureCoord; // from vertex shader", 
            "", 
            "void main() {", 
            "    // to convert to pixel units", 
            "    vec2 px = vec2(1.0, 1.0) / uImageSize;", 
            "", 
            "    float thresh = 0.15;", 
            "", 
            "    float neighbourSum = 0.0;", 
            "", 
            "    mat3 sobelX = mat3(-1,-2,-1,0,0,0,1,2,1);", 
            "    mat3 sobelY = mat3(-1,0,1,-2,0,2,-1,0,1);", 
            "", 
            "    float valueX = 0.0;", 
            "", 
            "    for(int c=0; c<3; c++){", 
            "        for(int r=0; r<3; r++){", 
            "          vec2 offs = vec2(c-1,r-1) * px;", 
            "          float kernelVal = sobelX[c][r];", 
            "          vec4 colour = texture2D(uSampler, vTextureCoord + offs);", 
            "          float grey = 0.299 * colour.r + 0.587 * colour.g + 0.114 * colour.b;", 
            "", 
            "          valueX += grey * kernelVal;", 
            "        }", 
            "    }", 
            "", 
            "    float valueY = 0.0;", 
            "", 
            "    for(int c=0; c<3; c++){", 
            "        for(int r=0; r<3; r++){", 
            "          vec2 offs = vec2(c-1,r-1) * px;", 
            "          float kernelVal = sobelY[c][r];", 
            "          vec4 colour = texture2D(uSampler, vTextureCoord + offs);", 
            "          float grey = 0.299 * colour.r + 0.587 * colour.g + 0.114 * colour.b;", 
            "", 
            "          valueY += grey * kernelVal;", 
            "        }", 
            "    }", 
            "", 
            "    float res = length(vec2(valueX, valueY));", 
            "", 
            "    if(res < thresh){", 
            "      res = 0.0;", 
            "    }", 
            "", 
            "    gl_FragColor = vec4(res, res, res, 1.0);", 
            "}"
        ]
    }, 
    "vertex": {
        "draw2d_test": [
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
            "   // pass aTextureCoord to fragment shader", 
            "   vTextureCoord = aTextureCoord;", 
            "}"
        ], 
        "lbpStage": [
            "// Uniforms - same for all vertices", 
            "uniform vec2 uResolution;", 
            "//Attributes - vertex-specific", 
            "attribute vec2 aPosition;", 
            "void main() {", 
            "   // convert pixel coords to range -1,1", 
            "   vec2 normCoords = ((aPosition/uResolution) * 2.0) - 1.0;", 
            "   gl_Position = vec4(normCoords, 0, 1);", 
            "}"
        ], 
        "draw2d": [
            "// Uniforms - same for all vertices", 
            "uniform vec2 uResolution;", 
            "//Attributes - vertex-specific", 
            "attribute vec2 aPosition;", 
            "attribute vec2 aTextureCoord;", 
            "// Varyings - for passing data to fragment shader", 
            "varying vec2 vTextureCoord;", 
            "void main() {", 
            "   // convert pixel coords to range -1,1", 
            "   vec2 normCoords = ((aPosition/uResolution) * 2.0) - 1.0;", 
            "   gl_Position = vec4(normCoords, 0, 1);", 
            "   // pass aTextureCoord to fragment shader", 
            "   vTextureCoord = aTextureCoord;", 
            "}"
        ]
    }
}