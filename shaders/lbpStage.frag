precision mediump float;
uniform sampler2D uSampler;
uniform sampler2D lbpLookupTexture;
uniform sampler2D activeWindows;

uniform vec2 uImageSize; // for pixel based calculation
varying vec2 vTextureCoord; // from vertex shader

// The maximum number of weak classifiers in a stage
//#define NWEAK 3
//#define STAGEN 0
#define WINSIZE 24.0

uniform vec2 leafValues[NWEAK];
uniform vec4 featureRectangles[NWEAK];
uniform float stageThreshold;
uniform vec2 lbpLookupTableSize;
uniform float scale;
uniform int scaleN;

// round for positive numbers only
#define round_pos(x) floor(x+0.5)

void main() {
  // to convert from pixel [0,w) to texture coordinates [0,1)
  vec2 px = vec2(1.0, 1.0) / uImageSize;
  vec2 halfpx = 0.5 * px;


  float sumStage = 0.0;

  int lbp;
  float dbg = 1.0;

  vec2 pos = gl_FragCoord.xy/uImageSize;
  float posx = pos.x;
  float posy = pos.y;

  bool acceptedFromPreviousStage;

  #if STAGEN > 0
  acceptedFromPreviousStage = texture2D(activeWindows, vec2(posx, posy)).x > 0.0;
  #else
  acceptedFromPreviousStage = true;
  #endif

  float alpha = 1.0;

  if (acceptedFromPreviousStage) {      
    //const int w = 1;
    for(int w = 0; w < NWEAK; w++) {
      vec4 rect = featureRectangles[w];

      #ifdef DEBUG_SHOWIMG
      rect.x = 0.0;
      rect.y = 0.0;
      rect.z = 1.0;
      rect.w = 1.0;
      #endif

      float rx = round_pos(scale * rect.x) * px.x;
      float ry = round_pos(scale * rect.y) * px.y;
      float rw = round_pos(scale * rect.z) * px.x;
      float rh = round_pos(scale * rect.w) * px.y;

  
      // Top left quadrant
      float p0 = texture2D(uSampler, vec2(posx + rx, posy + ry)).x;  // top left point
      float p1 = texture2D(uSampler, vec2(posx + rx + rw, posy + ry)).x; // top right pt
      float p2 = texture2D(uSampler, vec2(posx + rx, posy + (ry + rh))).x; // bottom left pt
      float p3 = texture2D(uSampler, vec2(posx + rx + rw, posy + (ry + rh))).x; // bottom right
    
      // Top right quadrant
      rx += 2.0 * rw;
      float p4 = texture2D(uSampler, vec2(posx + rx, posy + ry)).x;  // top left point
      float p5 = texture2D(uSampler, vec2(posx + rx + rw, posy + ry)).x; // top right pt
      float p6 = texture2D(uSampler, vec2(posx + rx, posy + ry + rh)).x; // bottom left pt
      float p7 = texture2D(uSampler, vec2(posx + rx + rw, posy + ry + rh)).x; // bottom right
    
      // Bottom right quadrant
      ry += 2.0 * rh;
      float p8 = texture2D(uSampler, vec2(posx + rx, posy + ry)).x;  // top left point
      float p9 = texture2D(uSampler, vec2(posx + rx + rw, posy + ry)).x; // top right pt
      float p10 = texture2D(uSampler, vec2(posx + rx, posy + ry + rh)).x; // bottom left pt
      float p11 = texture2D(uSampler, vec2(posx + rx + rw, posy + ry + rh)).x; // bottom right
    
      // Bottom left quadrant
      rx -= 2.0 * rw;
      float p12 = texture2D(uSampler, vec2(posx + rx, posy + ry)).x;  // top left point
      float p13 = texture2D(uSampler, vec2(posx + rx + rw, posy + ry)).x; // top right pt
      float p14 = texture2D(uSampler, vec2(posx + rx, posy + ry + rh)).x; // bottom left pt
      float p15 = texture2D(uSampler, vec2(posx + rx + rw, posy + ry + rh)).x; // bottom right
  
      float c = p8 - p6 - p13 + p3;
  
      float r0 = p3 - p2 - p1 + p0;
      float r1 = p6 - p4 - p3 + p1;
      float r2 = p7 - p5 - p6 + p4;
      float r3 = p9 - p7 - p8 + p6;
      float r4 = p11 - p9 - p10 + p8;
      float r5 = p10 - p8 - p15 + p13;
      float r6 = p15 - p13 - p14 + p12;
      float r7 = p13 - p3 - p12 + p2;

      #ifdef DEBUG_SHOWIMG
      dbg = r0;
      break;
      #endif
  
      lbp = (int(r0 > c) * 128) + (int(r1 > c) * 64) + (int(r2 > c) * 32) + (int(r3 > c) * 16) + (int(r4 > c) * 8) + (int(r5 > c) * 4) + (int(r6 > c) * 2) + int(r7 > c);
  
      // +0.5 to the numerator to get the pixel centre (since the texture coordinates give the bottom left of pixel)
  
      float lookup_x = (float(256 * w + lbp) + 0.5)/(lbpLookupTableSize.x); //float((256 * w + lbp)) / (lbpLookupTableSize.x);
      float lookup_y = (float(STAGEN) + 0.5)/ (lbpLookupTableSize.y);
  
      float bit = texture2D(lbpLookupTexture, vec2(lookup_x, lookup_y)).x;
  
      sumStage += bit * leafValues[w].x + (1.0 - bit) * leafValues[w].y;
  
      //if(w == 1) {
        // LBP image:
        //dbg = float(lbp)/255.0;
        //dbg = float(bit);
      //}
  
    }
  
    float accepted = float(sumStage > stageThreshold);

    #ifdef SCALES_SAME_TEXTURE
    float acceptedScale  = accepted * float(scaleN)/256.0;
        #ifdef BLEND_SCALES
        alpha = accepted;
        #else
        if (STAGEN == 19 && accepted == 0.0) {
            discard;
        }
        #endif
    #else
    float acceptedScale = accepted;
    #endif
  
    gl_FragColor = vec4(acceptedScale, accepted, accepted, alpha);
  
  } else {
    #ifdef SCALES_SAME_TEXTURE
    #ifndef BLEND_SCALES
    if (STAGEN == 19) {
        discard;
    }
    #endif
    #endif

    #ifdef BLEND_SCALES
    alpha = 0.0;
    #endif

    gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
  }


#ifdef DEBUG_INTEGRAL
    dbg = float(texture2D(uSampler, vec2(posx, posy)).x > 1500000.0);
    gl_FragColor = vec4(dbg, 0.0, 0.0, 1.0);
#endif


#ifdef DEBUG_SHOWIMG
    gl_FragColor = vec4(dbg/256.0, 0.0, 0.0, 1.0);
#endif

}
