window.headRange = 1;

function checkLytro() {
    try{
    lplayer = LYT.LFPLAYER;
    }
    catch(err){
        setTimeout(checkLytro,100);
        return;
    }

    if(!lplayer) {
        setTimeout(checkLytro,100);
        return;
    }
    lytroReady();
}
setTimeout(checkLytro,100);

function lytroReady() {
    console.log("lytro ready");

    c = [{
            url: LYT.PICTURE_URL,
            dimensionsMax: Number.POSITIVE_INFINITY,
            dimensionsMin: 600
        }, {
            url: LYT.PICTURE_SMALL_URL,
            dimensionsMax: 599,
            dimensionsMin: 400
        }, {
            url: LYT.PICTURE_TINY_URL,
            dimensionsMax: 399,
            dimensionsMin: 0
        }];

    lplayer = LYT.LFPLAYER
    LYT.LFPLAYER.on("picture_fully_loaded", picLoaded);

    LYT.LFPLAYER.loadPictureInfo(c, LYT.picture_id);
}

function picLoaded() {
    console.log("picture ready");

    input = LYT.LFPLAYER.get("userInput");

    target = input.get("inputTarget");

    cs = lplayer.get("controlSurface")


    node = lplayer.get("controlSurface").get("surfaceNode")


    input.isMouseDown = true;
    //input._handleMove({pageX:x + targetOffset, pageY:y + targetOffset});
    init();
}
    var vid;
    var fd;
    var drawShader;
    var rectShader;
    var vidTexture;
    var canvas;
    var attrs;
    var rectBuf;
    var stop = false;

    var init = function () {
        canvas = document.getElementById("glcanvas");
        vid = document.getElementById("webcamvideo");

        window.cv = WebCV.create(canvas);
        if (cv.gl === null) {
            alert("WebGL not supported");
        }
        gl = cv.gl;
        window.gl = gl;

        vidTexture = cv.gpu.blankTexture(vid.width, vid.height);

        drawShader = cv.shaders.getNamedShader("draw2d");

        // A simple rectangle (2 triangles)
        var vertCoords = new Float32Array([
            0.0,   0.0,
            canvas.width, 0.0,
            0.0,   canvas.height,
            0.0,   canvas.height,
            canvas.width, 0.0,
            canvas.width, canvas.height]);

        var vertBuf = cv.shaders.arrayBuffer(vertCoords);

        // Set up the texture coordinates
        var texCoords = new Float32Array([
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            1.0, 1.0]);

        var texBuf = cv.shaders.arrayBuffer(texCoords);
        rectBuf = cv.shaders.arrayBuffer(new Uint16Array([0]));

        attrs = {
            aTextureCoord: texBuf,
            aPosition: vertBuf,
        };

        cv.shaders.setAttributes(drawShader, attrs);

        var uniforms = {
            "uResolution": [canvas.width, canvas.height],
            //"uImageSize": [400, 300]
        };

        cv.shaders.setUniforms(drawShader, uniforms);


        rectShader = cv.shaders.getNamedShader("drawconst");
        cv.shaders.setUniforms(rectShader, {uResolution: [canvas.width, canvas.height]});


        cv.utils.getUserMedia({video: true}, videoLoaded, function () { alert("Couldn't get webcam"); });

        window.stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.bottom = '0px';
        stats.domElement.style.zoom = 2.0;
        $('body').append( stats.domElement );


        // Lookbox
            var box = $('<div>');
            box.css({"border": "solid 1px red",
                "background": "white",
                "position": "absolute",
                "left": 0,
                "top": 0,
                "width": 5,
                "height": 5,
                "z-index":1000});
            box.attr("id","lookbox");
            $('body').append(box);
    }


    function rectangleVertices(rects) {
        var outArray = [];
        // Not optimised for speed
        for (var i=0; i<rects.length; i+=1) {
            // rect elements = [x,y,w,h]
            var rect = rects[i];
            // Correct for y inversion
            var x=rect[0],
                y=canvas.height - rect[1],
                w=rect[2],
                h=-rect[3];
            // Top left
            outArray.push(x);
            outArray.push(y);
            // Top right
            outArray.push(x + w);
            outArray.push(y);
            outArray.push(x + w);
            outArray.push(y);
            // Bottom right
            outArray.push(x + w);
            outArray.push(y + h);
            outArray.push(x + w);
            outArray.push(y + h);
            // Bottom left
            outArray.push(x);
            outArray.push(y + h);
            outArray.push(x);
            outArray.push(y + h);
            // Top left
            outArray.push(x);
            outArray.push(y);
        }
        return outArray;
    }

    function frameLoop() {
        var frameLoopStart = new Date();
        // Do detection
        var rects = fd.detect(vid);

        rects = jsfeat.haar.group_rectangles(rects, window.minNeighbours);
            var bestNeighbourCount = 0;
            var bestRect;

            for (var i=0; i<rects.length; i+=1) {
                if (rects[i][4] > bestNeighbourCount) {
                    bestRect = rects[i];
                    bestNeighbourCount = rects[i][4];
                }
            }

            if(bestRect !== undefined) {
                rects = [bestRect];
                updateLytro(bestRect);
            } else {
                rects = [];
            }

        // Prepare to draw image
        gl.useProgram(drawShader);
        cv.shaders.setAttributes(drawShader, attrs);
        cv.gpu.uploadToTexture(vid, vidTexture);

        // XXX global pixelStorei set by uploadToTexture
        // messes up detection, reset here
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0)

        // Bind to texture unit 0
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, vidTexture);

        // Draw to screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, vid.width, vid.height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // Upload face rectangles to buffer
        var rectangleVerts = rectangleVertices(rects);
        gl.bindBuffer(gl.ARRAY_BUFFER, rectBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Uint16Array(rectangleVerts), gl.STATIC_DRAW);
        gl.useProgram(rectShader);
        cv.shaders.setAttributes(rectShader, {aPosition: rectBuf});
        gl.drawArrays(gl.LINES, 0, rectangleVerts.length/2);

        console.log("Frame loop time", new Date() - frameLoopStart);

        stats.update();

        if (!stop) {
            cv.utils.requestAnimationFrame(frameLoop);
        }
        stats.update();
    }

    function videoLoaded(stream) {
        fd = new FaceDetector(lbpcascade_frontalface, canvas.width, canvas.height);
        window.fd = fd;
        vid.src = stream;

        frameLoop();
    }



function updateLytro(rect) {
    targetOffset = input.get("inputTarget").getXY();

    var x = rect[0] + rect[2]/2
    var y = rect[1] + rect[3]/2

    var xnorm = (((x/canvas.width) * 2) - 1) * -1
    var ynorm = ((y/canvas.height) * 2) - 1

    var xfactor = 2.0
    var yfactor = 1.8

    xnorm *= xfactor
    ynorm *= yfactor

    w = lplayer.get("controlSurface").get("width")
    h = lplayer.get("controlSurface").get("height")

    var surfCentreX = w/2
    var surfCentreY = h/2

    surfX = surfCentreX + xnorm * w
    surfY = surfCentreY + ynorm * h

    console.log(xnorm, ynorm);



    YUI().use('node-event-simulate', function(Y) {
            var cx = surfX + targetOffset[0];
            var cy = surfY + targetOffset[1];
            Y.one(".controlSurface").simulate("mousemove",{clientX: cx, clientY: cy});
            $('#lookbox').css({
                "left": cx,
                "top": cy,
                });
            
            //Y.one(".controlSurface").simulate("mousemove");
    });

}
