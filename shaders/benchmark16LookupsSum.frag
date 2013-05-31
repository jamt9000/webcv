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

#define SUMVALS(v) ((v).x + (v).y + (v).z + (v).w);

// round for positive numbers only
#define round_pos(x) floor(x+0.5)

void main() {
  // to convert from pixel [0,w) to texture coordinates [0,1)
  vec2 px = vec2(1.0, 1.0) / uImageSize;
  vec2 halfpx = 0.5 * px;


  float sumStage = 0.0;

  int lbp;
  float dbg = 1.0;

  //vec2 pos = gl_FragCoord.xy/uImageSize;
  vec2 pos = vTextureCoord.xy/uImageSize;
  float posx = pos.x;
  float posy = pos.y;

    for(int w = 0; w < NWEAK; w++) {
      vec4 rect = featureRectangles[w];

      float rx = round_pos(scale * rect.x) * px.x;
      float ry = round_pos(scale * rect.y) * px.y;
      float rw = round_pos(scale * rect.z) * px.x;
      float rh = round_pos(scale * rect.w) * px.y;
  
      // Top left quadrant
      float p0 = SUMVALS(texture2D(uSampler, vec2(posx + rx, posy + ry)));  // top left point
      float p1 = SUMVALS(texture2D(uSampler, vec2(posx + rx + rw, posy + ry))); // top right pt
      float p2 = SUMVALS(texture2D(uSampler, vec2(posx + rx, posy + (ry + rh)))); // bottom left pt
      float p3 = SUMVALS(texture2D(uSampler, vec2(posx + rx + rw, posy + (ry + rh)))); // bottom right
    
      // Top right quadrant
      rx += 2.0 * rw;
      float p4 = SUMVALS(texture2D(uSampler, vec2(posx + rx, posy + ry)));  // top left point
      float p5 = SUMVALS(texture2D(uSampler, vec2(posx + rx + rw, posy + ry))); // top right pt
      float p6 = SUMVALS(texture2D(uSampler, vec2(posx + rx, posy + ry + rh))); // bottom left pt
      float p7 = SUMVALS(texture2D(uSampler, vec2(posx + rx + rw, posy + ry + rh))); // bottom right
    
      // Bottom right quadrant
      ry += 2.0 * rh;
      float p8 = SUMVALS(texture2D(uSampler, vec2(posx + rx, posy + ry)));  // top left point
      float p9 = SUMVALS(texture2D(uSampler, vec2(posx + rx + rw, posy + ry))); // top right pt
      float p10 = SUMVALS(texture2D(uSampler, vec2(posx + rx, posy + ry + rh))); // bottom left pt
      float p11 = SUMVALS(texture2D(uSampler, vec2(posx + rx + rw, posy + ry + rh))); // bottom right
    
      // Bottom left quadrant
      rx -= 2.0 * rw;
      float p12 = SUMVALS(texture2D(uSampler, vec2(posx + rx, posy + ry)));  // top left point
      float p13 = SUMVALS(texture2D(uSampler, vec2(posx + rx + rw, posy + ry))); // top right pt
      float p14 = SUMVALS(texture2D(uSampler, vec2(posx + rx, posy + ry + rh))); // bottom left pt
      float p15 = SUMVALS(texture2D(uSampler, vec2(posx + rx + rw, posy + ry + rh))); // bottom right

      float c = p8 - p6 - p13 + p3;
  
      float r0 = p3 - p2 - p1 + p0;
      float r1 = p6 - p4 - p3 + p1;
      float r2 = p7 - p5 - p6 + p4;
      float r3 = p9 - p7 - p8 + p6;
      float r4 = p11 - p9 - p10 + p8;
      float r5 = p10 - p8 - p15 + p13;
      float r6 = p15 - p13 - p14 + p12;
      float r7 = p13 - p3 - p12 + p2;

      dbg += r0+r1+r2+r3+r4+r5+r6+r7+c;
  }
  gl_FragColor = vec4(float(mod(dbg,255.))/256., 0.0, 0.0, 1.0);

}
