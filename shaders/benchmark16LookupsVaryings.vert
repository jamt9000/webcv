// Uniforms - same for all vertices
uniform vec2 uResolution;
//Attributes - vertex-specific
attribute vec2 aPosition;
attribute vec2 aTextureCoord;
// Varyings - for passing data to fragment shader
varying vec2 vTextureCoord;
uniform vec2 uImageSize; // for pixel based calculation

uniform vec2 leafValues[NWEAK];
uniform vec4 featureRectangles[NWEAK];

varying vec4 vRect[NWEAK];
uniform float scale;


#define round_pos(x) floor(x+0.5)

void main() {
   // convert pixel coords to range -1,1
   vec2 normCoords = ((aPosition/uResolution) * 2.0) - 1.0;
   gl_Position = vec4(normCoords, 0, 1);
   vec2 px = vec2(1.0, 1.0) / uImageSize;
   // pass aTextureCoord to fragment shader
   vTextureCoord = aTextureCoord;
   vec2 pos = aTextureCoord.xy/uImageSize;
   float posx = pos.x;
   float posy = pos.y;

    for(int w = 0; w < NWEAK; w++) {
      vec4 rect = featureRectangles[w];

      float rx = round_pos(scale * rect.x) * px.x;
      float ry = round_pos(scale * rect.y) * px.y;
      float rw = round_pos(scale * rect.z) * px.x;
      float rh = round_pos(scale * rect.w) * px.y;

      vRect[w] = vec4(rx+posx,ry+posy,rw,rh);
  
      // Top left quadrant
      /*
      vPos[w + 0] = vec2(posx + rx, posy + ry);  // top left point
      vPos[w + 1] = vec2(posx + rx + rw, posy + ry); // top right pt
      vPos[w + 2] = vec2(posx + rx, posy + (ry + rh)); // bottom left pt
      vPos[w + 3] = vec2(posx + rx + rw, posy + (ry + rh)); // bottom right
    
      // Top right quadrant
      rx += 2.0 * rw;
      vPos[w + 4] = vec2(posx + rx, posy + ry);  // top left point
      vPos[w + 5] = vec2(posx + rx + rw, posy + ry); // top right pt
      vPos[w + 6] = vec2(posx + rx, posy + ry + rh); // bottom left pt
      vPos[w + 7] = vec2(posx + rx + rw, posy + ry + rh); // bottom right
    
      // Bottom right quadrant
      ry += 2.0 * rh;
      vPos[w + 8] = vec2(posx + rx, posy + ry);  // top left point
      vPos[w + 8] = vec2(posx + rx + rw, posy + ry); // top right pt
      vPos[w + 10] = vec2(posx + rx, posy + ry + rh); // bottom left pt
      vPos[w + 11] = vec2(posx + rx + rw, posy + ry + rh); // bottom right
    
      // Bottom left quadrant
      rx -= 2.0 * rw;
      vPos[w + 12] = vec2(posx + rx, posy + ry);  // top left point
      vPos[w + 13] = vec2(posx + rx + rw, posy + ry); // top right pt
      vPos[w + 14] = vec2(posx + rx, posy + ry + rh); // bottom left pt
      vPos[w + 15] = vec2(posx + rx + rw, posy + ry + rh); // bottom right
      */
   }
}