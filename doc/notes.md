Coordinate Considerations
=========================

Working with the OpenGL ecosystem invariably requires an understanding of the 
different coordinate systems used for the polygons, textures and viewport. This 
becomes even more important when using OpenGL for computation, as being off by one
pixel (or a fraction of a pixel) can have much more serious consequences than
mere graphical glitches.

If a texture is used as a lookup table for arbitrary information, it is essential
that the correct values are indexed, to avoid giving, at best, completely incorrect
results, or at worst hard-to-detect bugs due to the limitations of floating point
precision in the 0 to 1 range used to index textures.

\cite{Peers2002} gives a detailed mathematical treatment of OpenGL coordinates,
drawing from the specification. In this way, the viewport can be treated as a 
Cartesian plane given by the gl.viewport(x,y,w,h) command (which gives the
transform from the normalised device coordinates, used for polygon vertices,
to window coordinates). This gives the x,y coordinates of the origin, which is at
the bottom-left edge of the image, and determines the area of the scene which
should be rasterised. Two important points to note here are that the Y axis is
effectively flipped relative to the coordinate system usually used in graphics, 
which has the origin at the top left, and that integer coordinates will index the
bottom left corners of pixels, so to index the centre of a pixel requires adding
0.5 to each dimension. For general purpose computation on a grid, modifying the viewport
can be used to change the output range of the computation. For example, when doing
face detection at different scales, the "sliding window" of the detector will change size, meaning less pixel positions need to be considered for larger windows, so the size of the
output grid should be smaller.

![Decreased output range for larger window](./facescale.png)
