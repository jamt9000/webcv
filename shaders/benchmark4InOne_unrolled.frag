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

  vec2 pos = ((2.0 * gl_FragCoord.xy)+.5)/uImageSize;
  float posx = pos.x;
  float posy = pos.y;

    for(int w = 0; w < NWEAK; w++) {
      vec4 rect = featureRectangles[w];

      float rx = round_pos(scale * rect.x) * px.x;
      float ry = round_pos(scale * rect.y) * px.y;
      float rw = round_pos(scale * rect.z) * px.x;
      float rh = round_pos(scale * rect.w) * px.y;
  
      // Top left quadrant
      float p0 = texture2D(uSampler, vec2(posx + rx, posy + ry)).x;  // top left point
      float p1 = texture2D(uSampler, vec2(posx + rx + rw, posy + ry)).x; // top right pt
      float p2 = texture2D(uSampler, vec2(posx + rx, posy + (ry + rh))).x; // bottom left pt
      float p3 = texture2D(uSampler, vec2(posx + rx + rw, posy + (ry + rh))).x; // bottom right

      float p0_2 = texture2D(uSampler, vec2(px.x + posx + rx, posy + ry)).x;  // top left point
      float p1_2 = texture2D(uSampler, vec2(px.x + posx + rx + rw, posy + ry)).x; // top right pt
      float p2_2 = texture2D(uSampler, vec2(px.x + posx + rx, posy + (ry + rh))).x; // bottom left pt
      float p3_2 = texture2D(uSampler, vec2(px.x + posx + rx + rw, posy + (ry + rh))).x; // bottom right

      float p0_3 = texture2D(uSampler, vec2(px.x + posx + rx, px.y + posy + ry)).x;  // top left point
      float p1_3 = texture2D(uSampler, vec2(px.x + posx + rx + rw, px.y + posy + ry)).x; // top right pt
      float p2_3 = texture2D(uSampler, vec2(px.x + posx + rx, px.y + posy + (ry + rh))).x; // bottom left pt
      float p3_3 = texture2D(uSampler, vec2(px.x + posx + rx + rw, px.y + posy + (ry + rh))).x; // bottom right

      float p0_4 = texture2D(uSampler, vec2(posx + rx, px.y + posy + ry)).x;  // top left point
      float p1_4 = texture2D(uSampler, vec2(posx + rx + rw, px.y + posy + ry)).x; // top right pt
      float p2_4 = texture2D(uSampler, vec2(posx + rx, px.y + posy + (ry + rh))).x; // bottom left pt
      float p3_4 = texture2D(uSampler, vec2(posx + rx + rw, px.y + posy + (ry + rh))).x; // bottom right
    
      // Top right quadrant
      rx += 2.0 * rw;
      float p4 = texture2D(uSampler, vec2(posx + rx, posy + ry)).x;  // top left point
      float p5 = texture2D(uSampler, vec2(posx + rx + rw, posy + ry)).x; // top right pt
      float p6 = texture2D(uSampler, vec2(posx + rx, posy + ry + rh)).x; // bottom left pt
      float p7 = texture2D(uSampler, vec2(posx + rx + rw, posy + ry + rh)).x; // bottom right

      float p4_2 = texture2D(uSampler, vec2(px.x + posx + rx, posy + ry)).x;  // top left point
      float p5_2 = texture2D(uSampler, vec2(px.x + posx + rx + rw, posy + ry)).x; // top right pt
      float p6_2 = texture2D(uSampler, vec2(px.x + posx + rx, posy + ry + rh)).x; // bottom left pt
      float p7_2 = texture2D(uSampler, vec2(px.x + posx + rx + rw, posy + ry + rh)).x; // bottom right

      float p4_3 = texture2D(uSampler, vec2(px.x + posx + rx, px.y + posy + ry)).x;  // top left point
      float p5_3 = texture2D(uSampler, vec2(px.x + posx + rx + rw, px.y + posy + ry)).x; // top right pt
      float p6_3 = texture2D(uSampler, vec2(px.x + posx + rx, px.y + posy + ry + rh)).x; // bottom left pt
      float p7_3 = texture2D(uSampler, vec2(px.x + posx + rx + rw, px.y + posy + ry + rh)).x; // bottom right

      float p4_4 = texture2D(uSampler, vec2(posx + rx, px.y + posy + ry)).x;  // top left point
      float p5_4 = texture2D(uSampler, vec2(posx + rx + rw, px.y + posy + ry)).x; // top right pt
      float p6_4 = texture2D(uSampler, vec2(posx + rx, px.y + posy + ry + rh)).x; // bottom left pt
      float p7_4 = texture2D(uSampler, vec2(posx + rx + rw, px.y + posy + ry + rh)).x; // bottom right
    
      // Bottom right quadrant
      ry += 2.0 * rh;
      float p8 = texture2D(uSampler, vec2(posx + rx, posy + ry)).x;  // top left point
      float p9 = texture2D(uSampler, vec2(posx + rx + rw, posy + ry)).x; // top right pt
      float p10 = texture2D(uSampler, vec2(posx + rx, posy + ry + rh)).x; // bottom left pt
      float p11 = texture2D(uSampler, vec2(posx + rx + rw, posy + ry + rh)).x; // bottom right

      float p8_2 = texture2D(uSampler, vec2(px.x + posx + rx, posy + ry)).x;  // top left point
      float p9_2 = texture2D(uSampler, vec2(px.x + posx + rx + rw, posy + ry)).x; // top right pt
      float p10_2 = texture2D(uSampler, vec2(px.x + posx + rx, posy + ry + rh)).x; // bottom left pt
      float p11_2 = texture2D(uSampler, vec2(px.x + posx + rx + rw, posy + ry + rh)).x; // bottom right

      float p8_3 = texture2D(uSampler, vec2(px.x + posx + rx, px.y + posy + ry)).x;  // top left point
      float p9_3 = texture2D(uSampler, vec2(px.x + posx + rx + rw, px.y + posy + ry)).x; // top right pt
      float p10_3 = texture2D(uSampler, vec2(px.x + posx + rx, px.y + posy + ry + rh)).x; // bottom left pt
      float p11_3 = texture2D(uSampler, vec2(px.x + posx + rx + rw, px.y + posy + ry + rh)).x; // bottom right

      float p8_4 = texture2D(uSampler, vec2(posx + rx, px.y + posy + ry)).x;  // top left point
      float p9_4 = texture2D(uSampler, vec2(posx + rx + rw, px.y + posy + ry)).x; // top right pt
      float p10_4 = texture2D(uSampler, vec2(posx + rx, px.y + posy + ry + rh)).x; // bottom left pt
      float p11_4 = texture2D(uSampler, vec2(posx + rx + rw, px.y + posy + ry + rh)).x; // bottom right
    
      // Bottom left quadrant
      rx -= 2.0 * rw;
      float p12 = texture2D(uSampler, vec2(posx + rx, posy + ry)).x;  // top left point
      float p13 = texture2D(uSampler, vec2(posx + rx + rw, posy + ry)).x; // top right pt
      float p14 = texture2D(uSampler, vec2(posx + rx, posy + ry + rh)).x; // bottom left pt
      float p15 = texture2D(uSampler, vec2(posx + rx + rw, posy + ry + rh)).x; // bottom right

      float p12_2 = texture2D(uSampler, vec2(px.x + posx + rx, posy + ry)).x;  // top left point
      float p13_2 = texture2D(uSampler, vec2(px.x + posx + rx + rw, posy + ry)).x; // top right pt
      float p14_2 = texture2D(uSampler, vec2(px.x + posx + rx, posy + ry + rh)).x; // bottom left pt
      float p15_2 = texture2D(uSampler, vec2(px.x + posx + rx + rw, posy + ry + rh)).x; // bottom right

      float p12_3 = texture2D(uSampler, vec2(px.x + posx + rx, px.y + posy + ry)).x;  // top left point
      float p13_3 = texture2D(uSampler, vec2(px.x + posx + rx + rw, px.y + posy + ry)).x; // top right pt
      float p14_3 = texture2D(uSampler, vec2(px.x + posx + rx, px.y + posy + ry + rh)).x; // bottom left pt
      float p15_3 = texture2D(uSampler, vec2(px.x + posx + rx + rw, px.y +  posy + ry + rh)).x; // bottom right4

      float p12_4 = texture2D(uSampler, vec2(posx + rx, px.y + posy + ry)).x;  // top left point
      float p13_4 = texture2D(uSampler, vec2(posx + rx + rw, px.y + posy + ry)).x; // top right pt
      float p14_4 = texture2D(uSampler, vec2(posx + rx, px.y + posy + ry + rh)).x; // bottom left pt
      float p15_4 = texture2D(uSampler, vec2(posx + rx + rw, px.y +  posy + ry + rh)).x; // bottom right

      float c = p8 - p6 - p13 + p3;
  
      float r0 = p3 - p2 - p1 + p0;
      float r1 = p6 - p4 - p3 + p1;
      float r2 = p7 - p5 - p6 + p4;
      float r3 = p9 - p7 - p8 + p6;
      float r4 = p11 - p9 - p10 + p8;
      float r5 = p10 - p8 - p15 + p13;
      float r6 = p15 - p13 - p14 + p12;
      float r7 = p13 - p3 - p12 + p2;

      float c_2 = p8_2 - p6_2 - p13_2 + p3_2;
  
      float r0_2 = p3_2 - p2_2 - p1_2 + p0_2;
      float r1_2 = p6_2 - p4_2 - p3_2 + p1_2;
      float r2_2 = p7_2 - p5_2 - p6_2 + p4_2;
      float r3_2 = p9_2 - p7_2 - p8_2 + p6_2;
      float r4_2 = p11_2 - p9_2 - p10_2 + p8_2;
      float r5_2 = p10_2 - p8_2 - p15_2 + p13_2;
      float r6_2 = p15_2 - p13_2 - p14_2 + p12_2;
      float r7_2 = p13_2 - p3_2 - p12_2 + p2_2;

      float c_3 = p8_3 - p6_3 - p13_3 + p3_3;
  
      float r0_3 = p3_3 - p2_3 - p1_3 + p0_3;
      float r1_3 = p6_3 - p4_3 - p3_3 + p1_3;
      float r2_3 = p7_3 - p5_3 - p6_3 + p4_3;
      float r3_3 = p9_3 - p7_3 - p8_3 + p6_3;
      float r4_3 = p11_3 - p9_3 - p10_3 + p8_3;
      float r5_3 = p10_3 - p8_3 - p15_3 + p13_3;
      float r6_3 = p15_3 - p13_3 - p14_3 + p12_3;
      float r7_3 = p13_3 - p3_3 - p12_3 + p2_3;


      float c_4 = p8_4 - p6_4 - p13_4 + p3_4;
  
      float r0_4 = p3_4 - p2_4 - p1_4 + p0_4;
      float r1_4 = p6_4 - p4_4 - p3_4 + p1_4;
      float r2_4 = p7_4 - p5_4 - p6_4 + p4_4;
      float r3_4 = p9_4 - p7_4 - p8_4 + p6_4;
      float r4_4 = p11_4 - p9_4 - p10_4 + p8_4;
      float r5_4 = p10_4 - p8_4 - p15_4 + p13_4;
      float r6_4 = p15_4 - p13_4 - p14_4 + p12_4;
      float r7_4 = p13_4 - p3_4 - p12_4 + p2_4;

      dbg += r0+r1+r2+r3+r4+r5+r6+r7+c;
      dbg += r0_2+r1_2+r2_2+r3_2+r4_2+r5_2+r6_2+r7_2+c_2;
      dbg += r0_3+r1_3+r2_3+r3_3+r4_3+r5_3+r6_3+r7_3+c_3;
      dbg += r0_4+r1_4+r2_4+r3_4+r4_4+r5_4+r6_4+r7_4+c_4;
  }
  gl_FragColor = vec4(float(mod(dbg,255.))/256., 0.0, 0.0, 1.0);

}
