precision mediump float;
uniform sampler2D uSampler;
uniform sampler2D lbpLookupTexture;
uniform sampler2D activeWindows;

uniform vec2 uImageSize;
uniform vec2 uIntegralImageSize;
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

#define integralCoord(v)  ((v)/uIntegralImageSize)

#define lerp(a,b,w) ((a) + (w) * ((b)-(a)))

// Bilinear interpolation
float sampleInterp(float x, float y) {
    // Offset so pixel is at integer position
    x -= 0.5;
    y -= 0.5;

    float x_int = floor(x);
    float y_int = floor(y);
    float x_frac = x - x_int;
    float y_frac = y - y_int;

    // Re-offset for lookup at pixel centre
    x_int += 0.5;
    y_int += 0.5;

    float l1 = lerp(texture2D(uSampler, integralCoord(vec2(x_int, y_int))).x, 
                    texture2D(uSampler, integralCoord(vec2(x_int + 1.0, y_int))).x,
                    x_frac);
    float l2 = lerp(texture2D(uSampler, integralCoord(vec2(x_int, y_int + 1.0))).x, 
                    texture2D(uSampler, integralCoord(vec2(x_int + 1.0, y_int + 1.0))).x,
                    x_frac);
    return lerp(l1, l2, y_frac);
}



void main() {
  // to convert from pixel [0,w) to texture coordinates [0,1)
  vec2 px = vec2(1.0, 1.0) / uImageSize;

  float sumStage = 0.0;

  int lbp;
  float dbg = 1.0;

  // Screen position
  // Note gl_FragCoord is ALREADY offset by 0.5 to get pixel center!
  float posx = gl_FragCoord.x;
  float posy = gl_FragCoord.y;

  /*
  // Pixel skipping
  if(mod(posx-0.5, 4.0) != 0.0) {
    gl_FragColor = vec4(float(scaleN)/255., 0.,0.,0.);
    return;
  }

  if(mod(posy-0.5, 4.0) != 0.0) {
    gl_FragColor = vec4(float(scaleN)/255., 0.,0.,0.);
    return;
  }
 */ 

  // Texture coordinates for original or output image
  vec2 imagePosition = (gl_FragCoord.xy)/uImageSize;

  bool acceptedFromPreviousStage;

  #if STAGEN > 0
  acceptedFromPreviousStage = texture2D(activeWindows, imagePosition).x > 0.0;
  #else
  acceptedFromPreviousStage = true;
  #endif

  #ifndef ZCULL
  if (acceptedFromPreviousStage) {      
  #endif
    for(int w = 0; w < NWEAK; w++) {
      vec4 rect = featureRectangles[w];

      #ifdef DEBUG_SHOWIMG
      rect.x = 0.0;
      rect.y = 0.0;
      rect.z = 1.0;
      rect.w = 1.0;
      #endif

      float rx = scale * rect.x;
      float ry = scale * rect.y;
      float rw = scale * rect.z;
      float rh = scale * rect.w;

      // Top left quadrant
      float p0  = sampleInterp(posx + rx,      posy + ry);  // top left point
      float p1  = sampleInterp(posx + rx + rw, posy + ry); // top right pt
      float p2  = sampleInterp(posx + rx,      posy + (ry + rh)); // bottom left pt
      float p3  = sampleInterp(posx + rx + rw, posy + (ry + rh)); // bottom right
    
      // Top right quadrant
      rx += 2.0 * rw;
      float p4  = sampleInterp(posx + rx,      posy + ry);  // top left point
      float p5  = sampleInterp(posx + rx + rw, posy + ry); // top right pt
      float p6  = sampleInterp(posx + rx,      posy + ry + rh); // bottom left pt
      float p7  = sampleInterp(posx + rx + rw, posy + ry + rh); // bottom right
    
      // Bottom right quadrant
      ry += 2.0 * rh;
      float p8  = sampleInterp(posx + rx,      posy + ry);  // top left point
      float p9  = sampleInterp(posx + rx + rw, posy + ry); // top right pt
      float p10 = sampleInterp(posx + rx,      posy + ry + rh); // bottom left pt
      float p11 = sampleInterp(posx + rx + rw, posy + ry + rh); // bottom right
    
      // Bottom left quadrant
      rx -= 2.0 * rw;
      float p12 = sampleInterp(posx + rx,      posy + ry);  // top left point
      float p13 = sampleInterp(posx + rx + rw, posy + ry); // top right pt
      float p14 = sampleInterp(posx + rx,      posy + ry + rh); // bottom left pt
      float p15 = sampleInterp(posx + rx + rw, posy + ry + rh); // bottom right
  
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
  
      lbp = (int(r0 >= c) * 128) + (int(r1 >= c) * 64) + (int(r2 >= c) * 32) + (int(r3 >= c) * 16) + (int(r4 >= c) * 8) + (int(r5 >= c) * 4) + (int(r6 >= c) * 2) + int(r7 >= c);
  
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

    float acceptedScale  = accepted * float(scaleN)/255.0;

    #ifdef ZCULL
            if(sumStage > stageThreshold) {
                #ifdef LAST_STAGE
                gl_FragColor = vec4(acceptedScale, accepted, accepted, accepted);
                #else
                discard;
                #endif
            } else {
                #ifdef LAST_STAGE
                discard;
                #else
                gl_FragColor = vec4(1.0,0.0,0.0,1.0);
                #endif
            }
    #else

    gl_FragColor = vec4(acceptedScale, accepted, accepted, accepted);

    #endif
  
#ifndef ZCULL
  } else {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
  }
#endif




#ifdef DEBUG_INTEGRAL
    dbg = float(texture2D(uSampler, integralCoord(vec2(posx,posy))).x > 1500000.0);
    gl_FragColor = vec4(dbg, 0.0, 0.0, 1.0);
#endif


#ifdef DEBUG_SHOWIMG
    gl_FragColor = vec4(dbg/256.0, 0.0, 0.0, 1.0);
#endif

}
