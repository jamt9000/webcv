// Uniforms - same for all vertices
uniform vec2 uResolution;
//Attributes - vertex-specific
attribute vec2 aPosition;
void main() {
   // convert pixel coords to range -1,1
   vec2 normCoords = ((aPosition/uResolution) * 2.0) - 1.0;
   gl_Position = vec4(normCoords, 0, 1);
}
