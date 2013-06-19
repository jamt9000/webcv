function start(x,y) {
    x = 10
    y = 10


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

    LYT.LFPLAYER.loadPictureInfo(c, LYT.picture_id);

    LYT.LFPLAYER.on("picture_fully_loaded", function () {

    input = LYT.LFPLAYER.get("userInput");

    target = input.get("inputTarget");
    targetOffset = input.get("inputTarget").getXY();

    w = lplayer.get("controlSurface").get("width")
    h = lplayer.get("controlSurface").get("height")

    cs = lplayer.get("controlSurface")


    node = lplayer.get("controlSurface").get("surfaceNode")


    input.isMouseDown = true;


    //input._handleMove({pageX:x + targetOffset, pageY:y + targetOffset});
});

}
