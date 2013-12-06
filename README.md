Face Detection in the Browser with WebGL
========================================

The getUserMedia webcam access API in modern browsers offers exciting possibilities
for "runs anywhere" Computer Vision, but with the limitation that performance
is typically limited by the use of JavaScript.

Meanwhile, Vision algorithms are increasingly being implemented on the GPU with
CUDA and OpenCL. This project takes advantage of the GPU within a browser
environment by using WebGL shaders to implement a face detection algorithm
in a fast, parallel way. 

Since WebGL is primarily a graphics API, this approach has some rough edges,
and could be considered more of a stop-gap measure until projects like
[WebCL](http://www.khronos.org/webcl/) reach maturity. But the viability of
Vision on the web is definitely on the rise, and with it comes the need for
Vision libraries, a web-based analogue to [OpenCV](http://opencv.org/).

This repository has somewhat ambitiously been titled WebCV, despite only doing
face detection so far. 

As it grows, it would be nice to have backend-agnostic approach, giving an API that would not be tied to WebGL, and could take advantage of WebCL or other technologies
if available. (Similarly to how THREE.js can fallback to a Canvas2D renderer)

Demos
=====

On Windows, the ANGLE DirectX conversion makes things slow. To use native
OpenGL, launch chrome with

    chrome.exe --use-gl=desktop

Or in Firefox set `webgl.prefer-native-gl=true` in about:config

[Basic detection demo](http://jamt9000.github.io/webcv/demos/webcam-facedetect.html)

[Head tracking](http://jamt9000.github.io/webcv/demos/webcam-track.html)
