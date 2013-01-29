precision highp float;
uniform sampler2D uSampler;
uniform sampler2D lbpLookupTexture;

uniform vec2 uImageSize; // for pixel based calculation
varying vec2 vTextureCoord; // from vertex shader

// The maximum number of weak classifiers in a stage
//#define NWEAK 3
//#define STAGEN 0
#define BITVECTOR_NELEM 8

uniform vec2 leafValues[NWEAK];
uniform int categoryBitVectors[NWEAK * BITVECTOR_NELEM];
uniform vec4 featureRectangles[NWEAK];
uniform float stageThreshold;
uniform vec2 lbpLookupTableSize;
       
void main() {
  // to convert to pixel units
  vec2 px = vec2(1.0, 1.0) / uImageSize;

  float posx = vTextureCoord.x;
  float posy = vTextureCoord.y;

  float sumStage = 0.0;

  int lbp;
  float dbg;

  //const int w = 1;
  for(int w = 0; w < NWEAK; w++) {
    vec4 rect = featureRectangles[w];
    float rx = rect.x * px.x;
    float ry = rect.y * px.y;
    float rw = rect.z * px.x;
    float rh = rect.w * px.y;

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

    lbp = (int(r0 > c) * 128) + (int(r1 > c) * 64) + (int(r2 > c) * 32) + (int(r3 > c) * 16) + (int(r4 > c) * 8) + (int(r5 > c) * 4) + (int(r6 > c) * 2) + int(r7 > c);

    //int lbp_arrayindex = (int(r0 > c) * 4) + (int(r1 > c) * 2) + (int(r2 > c));
   
    //int lbp_bitindex = (int(r3 > c) * 16) + (int(r4 > c) * 8) + (int(r5 > c) * 4) + (int(r6 > c) * 2) + int(r7 > c);
   
    //int bitvectorCell;// = categoryBitVectors[w * BITVECTOR_NELEM + lbp_arrayindex];
   
    //for(int k=0; k<8; k++) {
    //    if(k == lbp_arrayindex) {
    //        bitvectorCell = categoryBitVectors[w * BITVECTOR_NELEM + k];
    //    }
    //}
   
    //float bitpower = pow(2.0, float(lbp_bitindex));
   
    //int bitdiv = bitvectorCell / int(bitpower);
   
    //// Odd == bit set
    //// Even == bit not set
   
    //float parity = mod(float(bitdiv), 2.0);
   
    //int bit = int(parity);

    // x - 1.0 when dividing by sizes because interval [0.0,1.0] is inclusive, so 1.0 should be max index

    float lookup_x = float(256 * w + lbp)/(lbpLookupTableSize.x - 1.0); //float((256 * w + lbp)) / (lbpLookupTableSize.x);
    float lookup_y = float(STAGEN) / (lbpLookupTableSize.y - 1.0);

    float bit = texture2D(lbpLookupTexture, vec2(lookup_x, lookup_y)).x;

    sumStage += bit * leafValues[w].x + (1.0 - bit) * leafValues[w].y;

    //if(w == 1) {
      // LBP image:
      //dbg = float(lbp)/255.0;
      //dbg = float(bit);
    //}

  }

  //gl_FragColor = vec4(dbg, dbg, dbg, 1.0);

  float accepted = float(sumStage > stageThreshold);

  gl_FragColor = vec4(accepted, accepted, accepted, 1.0);
}