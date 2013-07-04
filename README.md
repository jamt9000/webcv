Face detection in the web browser using WebGL

Main face detection code is in
webcv-facedetect.js  (javascript)
shaders/lbpStage.frag (fragment shader code)

Run ./testserver.py to launch a simple server at localhost:8000 and try the demos, eg.
localhost:8000/demos/webcam-facedetect.html
localhost:8000/demos/webcam-track.html

If webgl does not work, try using Chrome with the flags:
    google-chrome --enable-webgl --ignore-gpu-blacklist


Code is my own except where stated, and with the following 3rd party libraries
and files:

    sylvester.js (Matrix library)
    demos/Stats.js (fps counter)
    demos/three.min.js (THREE.js 3D geometry library)
    demos/TrackballControls.js
    demos/THREEx.WindowResize.js
    demos/droid_sans_regular.typeface.js
    demos/ColladaLoader.js
    demos/FlyControls.js (...all THREE.js utility stuff)
    
    demos/jquery.js (JQuery javascript library)
    
    demos/jsfeat/ (an implementation of face detection in javascript used for comparison)
    demos/jsfeat_haar.js (the jsfeat haar detector, used for its rectangle clustering, with some modifications)
    demos/objdetect.js (another js face detector, which jsfeat is based on)
    
    demos/dat.gui.min.js (simple gui library)
    demos/deck (javascript presentation library)
    demos/lytro.html (contains the code from Lytro.com embeddable iframe)
    scripts/shader.py (For loading shaders with python)
    
    scripts/lbpcascade_frontalface.xml (XML cascade file from the OpenCV project)
    demos/lbpcascade_frontalface.js (The same file converted to JavaScript)

    demos/resources (contains 3D models and textures from the web)
    And various images scattered around are from the CMU/MIT face dataset or other online sources
