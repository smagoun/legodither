
// value is arbitrary, chosen experimentally
const EPSILON = 0.001

const PIXEL_STRIDE = 4;

// Pixel colors are RGBA
// TODO: Convert image processing to Uint8Array? Loses precision though
const BLACK = [0,   0,   0,   255];
const WHITE = [255, 255, 255, 255];
const GRAY  = [127.5, 127.5, 127.5, 255];
const HI  = 135 + 15/32;
const LO  = 119 + 17/32;
const DK_GR = [LO, LO, LO, 255];
const LT_GR = [HI, HI, HI, 255];

const BLUE  = [0, 0, 255, 255];
const YELLOW = [255, 255, 0, 255];

const BLACK_8x8 = new Array(64).fill(BLACK);
const WHITE_8x8 = new Array(64).fill(WHITE);

const BLACK_7x5 = new Array(35).fill(BLACK);

const CHECKERBOARD_BW_8x8 = [
    BLACK, WHITE, BLACK, WHITE, BLACK, WHITE, BLACK, WHITE,
    WHITE, BLACK, WHITE, BLACK, WHITE, BLACK, WHITE, BLACK,
    BLACK, WHITE, BLACK, WHITE, BLACK, WHITE, BLACK, WHITE,
    WHITE, BLACK, WHITE, BLACK, WHITE, BLACK, WHITE, BLACK,
    BLACK, WHITE, BLACK, WHITE, BLACK, WHITE, BLACK, WHITE,
    WHITE, BLACK, WHITE, BLACK, WHITE, BLACK, WHITE, BLACK,
    BLACK, WHITE, BLACK, WHITE, BLACK, WHITE, BLACK, WHITE,
    WHITE, BLACK, WHITE, BLACK, WHITE, BLACK, WHITE, BLACK,
];

const CHECKERBOARD_BW_7x5 = [
    BLACK, WHITE, BLACK, WHITE, BLACK, WHITE, BLACK,
    WHITE, BLACK, WHITE, BLACK, WHITE, BLACK, WHITE,
    BLACK, WHITE, BLACK, WHITE, BLACK, WHITE, BLACK,
    WHITE, BLACK, WHITE, BLACK, WHITE, BLACK, WHITE,
    BLACK, WHITE, BLACK, WHITE, BLACK, WHITE, BLACK,
];

// Single line down the left edge for testing whether filters are wrapping
// from right edge to left
const LINE_BW_8x8 = new Array(64).fill(WHITE);
for (let y = 0; y < 64; y+=8) { LINE_BW_8x8[y] = BLACK} ;

const LINE_BW_7x5 = new Array(35).fill(WHITE);
for (let y = 0; y < 35; y += 7) { LINE_BW_7x5[y] = BLACK };

const SMILEY_COLOR_8x8 = [
    BLUE,  BLUE,   BLACK,  BLACK,  BLACK,  BLACK,  BLUE,   BLUE,
    BLUE,  BLACK,  YELLOW, YELLOW, YELLOW, YELLOW, BLACK,  BLUE,
    BLACK, YELLOW, BLACK,  YELLOW, BLACK,  YELLOW, YELLOW, BLACK,
    BLACK, YELLOW, BLACK,  YELLOW, BLACK,  YELLOW, YELLOW, BLACK,
    BLACK, YELLOW, YELLOW, YELLOW, YELLOW, BLACK,  YELLOW, BLACK,
    BLACK, YELLOW, BLACK,  BLACK,  BLACK,  YELLOW, YELLOW, BLACK,
    BLUE,  BLACK,  YELLOW, YELLOW, YELLOW, YELLOW, BLACK,  BLUE, 
    BLUE,  BLUE,   BLACK,  BLACK,  BLACK,  BLACK,  BLUE,   BLUE,
]

function testResize(fn, srcData, srcWidth, srcHeight, scaleFactor, expectedData) {
    // Prepare source image
    let srcLineStride = srcWidth * PIXEL_STRIDE;
    // Convert our human-friendly(ish) test data to single array of pixel data
    let srcImgData = {};
    srcImgData.data = new Array(srcData.length * PIXEL_STRIDE);
    for (let i = 0, j = 0; i < srcData.length; i++) {
        // Don't use array.concat or array.push, they don't scale
        srcImgData.data[j++] = srcData[i][0];
        srcImgData.data[j++] = srcData[i][1];
        srcImgData.data[j++] = srcData[i][2];
        srcImgData.data[j++] = srcData[i][3];
    }
    let srcImgInfo = new ImageInfo(srcWidth, srcHeight, srcLineStride, 
        PIXEL_STRIDE, srcImgData);

    // Prepare dest image. Dest image size should use the same rules
    // as in legodither.js:calculateDestSize()
    let destWidth = Math.round(srcWidth / scaleFactor);
    let destHeight = Math.round(srcHeight / scaleFactor);
    let destLineStride = destWidth * PIXEL_STRIDE;
    let destImgData = {};
    destImgData.data = new Array(destWidth * destHeight * PIXEL_STRIDE).fill(0);
    let destImgInfo = new ImageInfo(destWidth, destHeight, destLineStride,
        PIXEL_STRIDE, destImgData);

    // Resize, ensuring that the scale factor is compatible w/ image dimensions
    // TODO: resize() functions should't need a scale factor at all since they
    // already know src + dest dimensions
    let xscale = srcWidth / destWidth;
    let yscale = srcHeight / destHeight;
    fn(srcImgInfo, destImgInfo, xscale, yscale);

    // Convert our human-friendly(ish) test data to single array of pixel data
    let expectedImgData = {};
    expectedImgData.data = new Array(expectedData.length * PIXEL_STRIDE);
    for (let i = 0, j = 0; i < expectedData.length; i++) {
        // Don't use array.concat or array.push, they don't scale
        expectedImgData.data[j++] = expectedData[i][0];
        expectedImgData.data[j++] = expectedData[i][1];
        expectedImgData.data[j++] = expectedData[i][2];
        expectedImgData.data[j++] = expectedData[i][3];
    }

    // Compare
    let dLength = destImgData.data.length;
    let eLength = expectedImgData.data.length;
    if (dLength != eLength) {
        console.error(`dest data size ${dLength} does not match expected ${eLength}`);
    }
    for (let i = 0; i < (destWidth * destHeight * PIXEL_STRIDE); i++) {
        // Can't test for equality due to floating point math
        // TODO: Should it be invariant that resize functions only return integers?
        if (Number.isNaN(destImgData.data[i]) || Math.abs(destImgData.data[i] - expectedImgData.data[i]) > EPSILON) {
            console.error(`expected and dest do not match at index ${i}: d: ${destImgData.data[i]}, e: ${expectedImgData.data[i]}`);
        }
    }

    // Draw
    /*
    let canvas = document.createElement("canvas");
    canvas.setAttribute("width", destWidth);
    canvas.setAttribute("height", destHeight);
    document.body.appendChild(canvas);
    let spacer = document.createElement("span");
    spacer.textContent = " ";
    document.body.appendChild(spacer);

    // Copy to offscreen image, then copy back to the canvas
    // in order to scale without blurring/interpolation
    let sf = 16;
    let arr = new Uint8ClampedArray(destImgData.data);
    let imgData = new ImageData(arr, destWidth, destHeight);
    let context = canvas.getContext("2d");
    context.putImageData(imgData, 0, 0);
    let img = new Image(destWidth, destHeight);
    img.src = canvas.toDataURL();
    img.onload = function() {
        context.drawImage(img, 0, 0);
        canvas.setAttribute("style", `image-rendering: pixelated; width: ${destWidth*sf}px; height: ${destHeight*sf}px;`);  
    }*/
}

function testResizeBlack8x8(fn, scaleFactor, expectedImg) {
    testResize(fn, BLACK_8x8, 8, 8, scaleFactor, expectedImg);
}
function testResizeBlack7x5(fn, scaleFactor, expectedImg) {
    testResize(fn, BLACK_7x5, 7, 5, scaleFactor, expectedImg);
}
function testResizeWhite8x8(fn, scaleFactor, expectedImg) {
    testResize(fn, WHITE_8x8, 8, 8, scaleFactor, expectedImg);
}
function testResizeCheckers8x8(fn, scaleFactor, expectedImg) {
    testResize(fn, CHECKERBOARD_BW_8x8, 8, 8, scaleFactor, expectedImg);
}
function testResizeCheckers7x5(fn, scaleFactor, expectedImg) {
    testResize(fn, CHECKERBOARD_BW_7x5, 7, 5, scaleFactor, expectedImg);
}
function testResizeSmiley8x8(fn, scaleFactor, expectedImg) {
    testResize(fn, SMILEY_COLOR_8x8, 8, 8, scaleFactor, expectedImg);
}
function testResizeLine8x8(fn, scaleFactor, expectedImg) {
    testResize(fn, LINE_BW_8x8, 8, 8, scaleFactor, expectedImg);
}
function testResizeLine7x5(fn, scaleFactor, expectedImg) {
    testResize(fn, LINE_BW_7x5, 7, 5, scaleFactor, expectedImg);
}

/**
 * During testing, this scaling factor resulted box filter trying to
 * look at 501st column, thanks to vagaries of floating-point math
 */
function testResizeBox500x375_21x16() {
    let srcImg = new Array(500 * 375).fill(BLACK);
    let expectedImg = new Array(21 * 16).fill(BLACK);
    testResize(resizeBox, srcImg, 500, 375, (500 / 21), expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeBoxBlack8x8_1x() {
    testResizeBlack8x8(resizeBox, 1, BLACK_8x8);
}
function testResizeBoxBlack8x8_1_5x() {
    let expectedImg = new Array(5 * 5).fill(BLACK);
    testResizeBlack8x8(resizeBox, 1.5, expectedImg);
}
function testResizeBoxBlack8x8_2x() {
    let expectedImg = new Array(4 * 4).fill(BLACK);
    testResizeBlack8x8(resizeBox, 2, expectedImg);
}
function testResizeBoxBlack8x8_3x() {
    let expectedImg = new Array(3 * 3).fill(BLACK);
    testResizeBlack8x8(resizeBox, 3, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeBoxBlack7x5_1x() {
    testResizeBlack7x5(resizeBox, 1, BLACK_7x5);
}
function testResizeBoxBlack7x5_1_5x() {
    let expectedImg = new Array(5 * 3).fill(BLACK);
    testResizeBlack7x5(resizeBox, 1.5, expectedImg);
}
function testResizeBoxBlack7x5_2x() {
    let expectedImg = new Array(4 * 3).fill(BLACK);
    testResizeBlack7x5(resizeBox, 2, expectedImg);
}
function testResizeBoxBlack7x5_3x() {
    let expectedImg = new Array(2 * 2).fill(BLACK);
    testResizeBlack7x5(resizeBox, 3, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeBoxWhite8x8_1x() {
    testResizeWhite8x8(resizeBox, 1, WHITE_8x8);
}
function testResizeBoxWhite8x8_1_5x() {
    let expectedImg = new Array(5 * 5).fill(WHITE);
    testResizeWhite8x8(resizeBox, 1.5, expectedImg);
}
function testResizeBoxWhite8x8_2x() {
    let expectedImg = new Array(4 * 4).fill(WHITE);
    testResizeWhite8x8(resizeBox, 2, expectedImg);
}
function testResizeBoxWhite8x8_3x() {
    let expectedImg = new Array(3 * 3).fill(WHITE);
    testResizeWhite8x8(resizeBox, 3, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeBoxCheckers8x8_1x() {
    testResizeCheckers8x8(resizeBox, 1, CHECKERBOARD_BW_8x8);
}
function testResizeBoxCheckers8x8_1_5x() {
    let expectedImg = [
        DK_GR, DK_GR, GRAY, LT_GR, LT_GR,
        DK_GR, DK_GR, GRAY, LT_GR, LT_GR,
        GRAY,  GRAY,  GRAY, GRAY,  GRAY,
        LT_GR, LT_GR, GRAY, DK_GR, DK_GR,
        LT_GR, LT_GR, GRAY, DK_GR, DK_GR,
    ]
    testResizeCheckers8x8(resizeBox, 1.6, expectedImg);
}
function testResizeBoxCheckers8x8_2x() {
    let expectedImg = new Array(4 * 4).fill(GRAY);
    testResizeCheckers8x8(resizeBox, 2, expectedImg);
}
function testResizeBoxCheckers8x8_3x() {
    let expectedImg = new Array(3 * 3).fill(GRAY);
    // Corners in the dest are slightly biased since they overlap an odd
    // # of pixels in the src image
    expectedImg[0] = DK_GR;
    expectedImg[2] = LT_GR;
    expectedImg[6] = LT_GR;
    expectedImg[8] = DK_GR;
    testResizeCheckers8x8(resizeBox, 3, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeBoxCheckers7x5_1x() {
    testResizeCheckers7x5(resizeBox, 1, CHECKERBOARD_BW_7x5);
}
function testResizeBoxCheckers7x5_1_5x() {
    let GRAY_1 = [116.571, 116.571, 116.571, 255];
    let GRAY_2 = [123.857, 123.857, 123.857, 255];
    let GRAY_3 = [138.429, 138.429, 138.429, 255];
    let expectedImg = [
        GRAY_1, GRAY_2, GRAY_3, GRAY_2, GRAY_1,
        GRAY_1, GRAY_2, GRAY_3, GRAY_2, GRAY_1,
        GRAY_1, GRAY_2, GRAY_3, GRAY_2, GRAY_1,
    ]
    testResizeCheckers7x5(resizeBox, 1.5, expectedImg);
}
function testResizeBoxCheckers7x5_2x() {
    let GRAY_1 = [123.857, 123.857, 123.857, 255];
    let expectedImg = new Array(4 * 3).fill(GRAY_1);
    testResizeCheckers7x5(resizeBox, 2, expectedImg);
}
function testResizeBoxCheckers7x5_3x() {
    let GRAY_1 = [123.857, 123.857, 123.857, 255];
    let expectedImg = new Array(2 * 2).fill(GRAY_1);
    testResizeCheckers7x5(resizeBox, 3, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeBoxLine8x8_1x() {
    testResizeLine8x8(resizeBox, 1, LINE_BW_8x8);
}
function testResizeBoxLine8x8_1_5x() {
    let expectedImg = new Array(5 * 5).fill(WHITE);
    for (let y = 0; y < 25; y+=5) { expectedImg[y] = [ 95.625, 95.625, 95.625, 255] }
    testResizeLine8x8(resizeBox, 1.5, expectedImg);
}
function testResizeBoxLine8x8_2x() {
    let expectedImg = new Array(4 * 4).fill(WHITE);
    for (let y = 0; y < 16; y+=4) { expectedImg[y] = GRAY }
    testResizeLine8x8(resizeBox, 2, expectedImg);
}
function testResizeBoxLine8x8_3x() {
    let expectedImg = new Array(3 * 3).fill(WHITE);
    for (let y = 0; y < 9; y+=3) { expectedImg[y] = [ 159.375, 159.375, 159.375, 255] }
    testResizeLine8x8(resizeBox, 3, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeBoxLine7x5_1x() {
    testResizeLine7x5(resizeBox, 1, LINE_BW_7x5);
}
function testResizeBoxLine7x5_1_5x() {
    let expectedImg = new Array(5 * 3).fill(WHITE);
    for (let y = 0; y < 15; y+=5) { expectedImg[y] = [72.857, 72.857, 72.857, 255] }
    testResizeLine7x5(resizeBox, 1.5, expectedImg);
}
function testResizeBoxLine7x5_2x() {
    let expectedImg = new Array(4 * 3).fill(WHITE);
    for (let y = 0; y < 12; y+=4) { expectedImg[y] = [109.285, 109.285, 109.285, 255] }
    testResizeLine7x5(resizeBox, 2, expectedImg);
}
function testResizeBoxLine7x5_3x() {
    let expectedImg = new Array(2 * 2).fill(WHITE);
    for (let y = 0; y < 4; y+=2) { expectedImg[y] = [182.143, 182.143, 182.143, 255] }
    testResizeLine7x5(resizeBox, 3, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeBoxSmiley8x8_1x() {
    testResizeSmiley8x8(resizeBox, 1, SMILEY_COLOR_8x8);
}

function testResizeBoxSmiley8x8_1_5x() {
    const YELLOW_1 = [71.718,  71.718,  39.843,  255];
    const YELLOW_2 = [95.625,  95.625,  0,       255];
    const YELLOW_3 = [119.531, 119.531, 0,       255];
    const YELLOW_4 = [159.375, 159.375, 0,       255];
    const YELLOW_5 = [215.156, 215.156, 0,       255];
    const YELLOW_6 = [175.312, 175.312, 0,       255];
    const YELLOW_7 = [191.25,  191.25,  0,       255];
    const YELLOW_8 = [199.218, 199.218, 0,       255];
    const BLUE_1 =   [0,       0,       219.140, 255];
    let expectedImg = [
        BLUE_1,   YELLOW_1, YELLOW_2, YELLOW_1, BLUE_1,
        YELLOW_1, YELLOW_3, YELLOW_4, YELLOW_5, YELLOW_1,
        YELLOW_2, YELLOW_6, YELLOW_7, YELLOW_4, YELLOW_2,
        YELLOW_1, YELLOW_3, YELLOW_2, YELLOW_8, YELLOW_1,
        BLUE_1,   YELLOW_1, YELLOW_2, YELLOW_1, BLUE_1,
    ];
    testResizeSmiley8x8(resizeBox, 1.6, expectedImg);
}

function testResizeBoxSmiley8x8_2x() {
    const DK_YELLOW = [127.5, 127.5, 0, 255];
    const MED_BLUE = [0, 0, 191.25, 255];
    let expectedImg = new Array(4 * 4).fill(DK_YELLOW);
    expectedImg[0] = MED_BLUE;
    expectedImg[3] = MED_BLUE;
    expectedImg[12] = MED_BLUE;
    expectedImg[15] = MED_BLUE;
    testResizeSmiley8x8(resizeBox, 2, expectedImg);
}

function testResizeBoxSmiley8x8_3x() {
    const YELLOW_1 = [127.5,   127.5,   0,        255];
    const YELLOW_2 = [119.531, 119.531, 0,        255];
    const YELLOW_3 = [151.406, 151.406, 0,        255];
    const YELLOW_4 = [135.468, 135.468, 0,        255];
    const YELLOW_5 = [103.593, 103.593, 0,        255];
    const BLUE_1 =   [47.812,  47.812,  107.578,  255];
    const BLUE_2 =   [63.75,   63.75,   107.578,  255];
    let expectedImg = [
        BLUE_1,   YELLOW_1, BLUE_2,
        YELLOW_2, YELLOW_3, YELLOW_4,
        BLUE_1,   YELLOW_5, BLUE_2,
    ];
    testResizeSmiley8x8(resizeBox, 3, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeNNBlack8x8_1x() {
    testResizeBlack8x8(resizeNearestNeighbor, 1, BLACK_8x8);
}
function testResizeNNBlack8x8_1_5x() {
    let expectedImg = new Array(5 * 5).fill(BLACK);
    testResizeBlack8x8(resizeNearestNeighbor, 1.5, expectedImg);
}
function testResizeNNBlack8x8_2x() {
    let expectedImg = new Array(4 * 4).fill(BLACK);
    testResizeBlack8x8(resizeNearestNeighbor, 2, expectedImg);
}
function testResizeNNBlack8x8_3x() {
    let expectedImg = new Array(3 * 3).fill(BLACK);
    testResizeBlack8x8(resizeNearestNeighbor, 3, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeNNWhite8x8_1x() {
    testResizeWhite8x8(resizeNearestNeighbor, 1, WHITE_8x8);
}
function testResizeNNWhite8x8_1_5x() {
    let expectedImg = new Array(5 * 5).fill(WHITE);
    testResizeWhite8x8(resizeNearestNeighbor, 1.5, expectedImg);
}
function testResizeNNWhite8x8_2x() {
    let expectedImg = new Array(4 * 4).fill(WHITE);
    testResizeWhite8x8(resizeNearestNeighbor, 2, expectedImg);
}
function testResizeNNWhite8x8_3x() {
    let expectedImg = new Array(3 * 3).fill(WHITE);
    testResizeWhite8x8(resizeNearestNeighbor, 3, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeNNCheckers8x8_1x() {
    testResizeCheckers8x8(resizeNearestNeighbor, 1, CHECKERBOARD_BW_8x8);
}
function testResizeNNCheckers8x8_1_5x() {
    // Src pixels are 0, 2, 4, 5, 7 along both axes: (0,0), (2,2)...(7,7)
    let expectedImg = [
        BLACK, BLACK, BLACK, WHITE, WHITE,
        BLACK, BLACK, BLACK, WHITE, WHITE,
        BLACK, BLACK, BLACK, WHITE, WHITE,
        WHITE, WHITE, WHITE, BLACK, BLACK,
        WHITE, WHITE, WHITE, BLACK, BLACK,
    ];
    testResizeCheckers8x8(resizeNearestNeighbor, 1.6, expectedImg);
}

function testResizeNNCheckers8x8_2x() {
    // All black since we're sampling at exactly the frequency of the checkers
    // Src pixels are odd numbers: (1,1), (1,3)...(5,7), (7,7)
    let expectedImg = new Array(4 * 4).fill(BLACK);
    testResizeCheckers8x8(resizeNearestNeighbor, 2, expectedImg);
}

function testResizeNNCheckers8x8_3x() {
    let expectedImg = new Array(3 * 3).fill(BLACK);
    // Src pixels are at 1/4/6 along each axis: (1,1), (4,4), (6,6)
    expectedImg[1] = WHITE;
    expectedImg[2] = WHITE;
    expectedImg[3] = WHITE;
    expectedImg[6] = WHITE;
    testResizeCheckers8x8(resizeNearestNeighbor, 3, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeNNLine8x8_1x() {
    testResizeLine8x8(resizeNearestNeighbor, 1, LINE_BW_8x8);
}
function testResizeNNLine8x8_1_5x() {
    // Src pixels are 0, 2, 4, 5, 7 along both axes: (0,0), (2,2)...(7,7)
    let expectedImg = new Array(5 * 5).fill(WHITE);
    for (let y = 0; y < 25; y+=5) { expectedImg[y] = BLACK }
    testResizeLine8x8(resizeNearestNeighbor, 1.5, expectedImg);
}
function testResizeNNLine8x8_2x() {
    // All white since we don't sample the first column
    // Src pixels are odd numbers: (1,1), (1,3)...(5,7), (7,7)
    let expectedImg = new Array(4 * 4).fill(WHITE);
    testResizeLine8x8(resizeNearestNeighbor, 2, expectedImg);
}
function testResizeNNLine8x8_3x() {
    // All white since we don't sample the first column
    // Src pixels are at 1/4/6 along each axis: (1,1), (4,4), (6,6)
    let expectedImg = new Array(3 * 3).fill(WHITE);
    for (let y = 0; y < 9; y+=3) { expectedImg[y] = WHITE }
    testResizeLine8x8(resizeNearestNeighbor, 3, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeNNSmiley8x8_1x() {
    testResizeSmiley8x8(resizeNearestNeighbor, 1, SMILEY_COLOR_8x8);
}

function testResizeNNSmiley8x8_1_5x() {
    // Src pixels are 0, 2, 4, 5, 7 along both axes: (0,0), (2,2)...(7,7)
    let expectedImg = [
        BLUE,  BLACK,  BLACK,  BLACK,  BLUE,
        BLACK, BLACK,  BLACK,  YELLOW, BLACK,
        BLACK, YELLOW, YELLOW, BLACK,  BLACK,
        BLACK, BLACK,  BLACK,  YELLOW, BLACK,
        BLUE,  BLACK,  BLACK,  BLACK,  BLUE,
    ];
    testResizeSmiley8x8(resizeNearestNeighbor, 1.6, expectedImg);
}

function testResizeNNSmiley8x8_2x() {
    // Src pixels are odd numbers: (1,1), (1,3)...(5,7), (7,7)
    let expectedImg = [
        BLACK,  YELLOW, YELLOW, BLUE,
        YELLOW, YELLOW, YELLOW, BLACK,
        YELLOW, BLACK,  YELLOW, BLACK,
        BLUE,   BLACK,  BLACK,  BLUE,
    ];
    testResizeSmiley8x8(resizeNearestNeighbor, 2, expectedImg);
}

function testResizeNNSmiley8x8_3x() {
    // Src pixels are at 1/4/6 along each axis: (1,1), (4,4), (6,6)
    let expectedImg = [
        BLACK,  YELLOW, BLACK,
        YELLOW, YELLOW, YELLOW,
        BLACK,  YELLOW, BLACK,
    ];
    testResizeSmiley8x8(resizeNearestNeighbor, 3, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeBilinearBlack8x8_1x() {
    testResizeBlack8x8(resizeBilinear, 1, BLACK_8x8);
}
function testResizeBilinearBlack8x8_1_5x() {
    let expectedImg = new Array(5 * 5).fill(BLACK);
    testResizeBlack8x8(resizeBilinear, 1.5, expectedImg);
}
function testResizeBilinearBlack8x8_2x() {
    let expectedImg = new Array(4 * 4).fill(BLACK);
    testResizeBlack8x8(resizeBilinear, 2, expectedImg);
}
function testResizeBilinearBlack8x8_3x() {
    let expectedImg = new Array(3 * 3).fill(BLACK);
    testResizeBlack8x8(resizeBilinear, 3, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeBilinearWhite8x8_1x() {
    testResizeWhite8x8(resizeBilinear, 1, WHITE_8x8);
}
function testResizeBilinearWhite8x8_1_5x() {
    let expectedImg = new Array(5 * 5).fill(WHITE);
    testResizeWhite8x8(resizeBilinear, 1.5, expectedImg);
}
function testResizeBilinearWhite8x8_2x() {
    let expectedImg = new Array(4 * 4).fill(WHITE);
    testResizeWhite8x8(resizeBilinear, 2, expectedImg);
}
function testResizeBilinearWhite8x8_3x() {
    let expectedImg = new Array(3 * 3).fill(WHITE);
    testResizeWhite8x8(resizeBilinear, 3, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeBilinearCheckers8x8_1x() {
    testResizeCheckers8x8(resizeBilinear, 1, CHECKERBOARD_BW_8x8);
}

function testResizeBilinearCheckers8x8_1_5x() {
    // Src pixels are 0, 2, 4, 5, 7 along both axes: (0,0), (2,2)...(7,7)
    const GRAY_1 = [107.1, 107.1, 107.1, 255];
    const GRAY_2 = [86.7,  86.7,  86.7,  255];
    const GRAY_3 = [45.9,  45.9,  45.9,  255];
    const GRAY_4 = [168.3, 168.3, 168.3, 255];
    const GRAY_5 = [147.9, 147.9, 147.9, 255];
    const GRAY_6 = [209.1, 209.1, 209.1, 255];
    let expectedImg = [
        GRAY_1, GRAY_2, GRAY, GRAY_4, GRAY_5,
        GRAY_2, GRAY_3, GRAY, GRAY_6, GRAY_4,
        GRAY,   GRAY,   GRAY, GRAY,   GRAY,
        GRAY_4, GRAY_6, GRAY, GRAY_3, GRAY_2,
        GRAY_5, GRAY_4, GRAY, GRAY_2, GRAY_1,
    ];
    testResizeCheckers8x8(resizeBilinear, 1.5, expectedImg);
}

function testResizeBilinearCheckers8x8_2x() {
    // Same as box filter at this scaling factor
    let expectedImg = new Array(4 * 4).fill(GRAY);
    testResizeCheckers8x8(resizeBilinear, 2, expectedImg);
}

function testResizeBilinearCheckers8x8_3x() {
    let expectedImg = new Array(3 * 3).fill(GRAY);
    // Src pixels are at 1/4/6 along each axis: (1,1), (4,4), (6,6)
    const DK = [70.833,  70.833,  70.833,  255];
    const LT = [184.167, 184.167, 184.167, 255];
    expectedImg[0] = DK;
    expectedImg[2] = LT;
    expectedImg[6] = LT;
    expectedImg[8] = DK;
    testResizeCheckers8x8(resizeBilinear, 3, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeBilinearLine8x8_1x() {
    testResizeLine8x8(resizeBilinear, 1, LINE_BW_8x8);
}
function testResizeBilinearLine8x8_1_5x() {
    let expectedImg = new Array(5 * 5).fill(WHITE);
    // dest pixel is centered at 0.8, so dest pixel goes from 0.3-1.3 on the src
    // (70% of x=0) + (30% of x=1) ==> (.7*0 + .3*255) = 76.5
    for (let y = 0; y < 25; y+=5) { expectedImg[y] = [76.5, 76.5, 76.5, 255] }
    testResizeLine8x8(resizeBilinear, 1.5, expectedImg);
}
function testResizeBilinearLine8x8_2x() {
     // Same as box filter at this scaling factor
     let expectedImg = new Array(4 * 4).fill(WHITE);
    // 50% of x=0 and 50% of x=1
    for (let y = 0; y < 16; y+=4) { expectedImg[y] = GRAY }
    testResizeLine8x8(resizeBilinear, 2, expectedImg);
}
function testResizeBilinearLine8x8_3x() {
    let expectedImg = new Array(3 * 3).fill(WHITE);
    // dest pixel is centered at 1.333, so dest pixel goes from 0.833 - 1.833
    // on the src. (16.7% of x=0) + (83.3% of x=1) ==> (.167*0 + .833*255) = 212.5
    for (let y = 0; y < 9; y+=3) { expectedImg[y] = [212.5, 212.5, 212.5, 255] }
    testResizeLine8x8(resizeBilinear, 3, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeBilinearSmiley8x8_1x() {
    testResizeSmiley8x8(resizeBilinear, 1, SMILEY_COLOR_8x8);
}

function testResizeBilinearSmiley8x8_1_5x() {
    const YELLOW_1 = [68.85,  68.85,  17.85,  255];
    const YELLOW_2 = [76.5,   76.5,   0,      255];
    const YELLOW_3 = [45.9,   45.9,   0,      255];
    const YELLOW_4 = [140.25, 140.25, 0,      255];
    const YELLOW_5 = [252.45, 252.45, 0,      255];
    const YELLOW_6 = [191.25, 191.25, 0,      255];
    const YELLOW_7 = [25.5,   25.5,   0,      255];
    const BLUE_1 =   [0,      0,      232.05, 255];
    let expectedImg = [
        BLUE_1,   YELLOW_1, YELLOW_2, YELLOW_1, BLUE_1,
        YELLOW_1, YELLOW_3, YELLOW_4, YELLOW_5, YELLOW_1,
        YELLOW_2, YELLOW_4, YELLOW_6, YELLOW_4, YELLOW_2,
        YELLOW_1, YELLOW_3, YELLOW_7, YELLOW_5, YELLOW_1,
        BLUE_1,   YELLOW_1, YELLOW_2, YELLOW_1, BLUE_1,
    ];
    testResizeSmiley8x8(resizeBilinear, 1.6, expectedImg);
}

function testResizeBilinearSmiley8x8_2x() {
    // Same as box filter at this scaling factor
    const DK_YELLOW = [127.5, 127.5, 0,      255];
    const MED_BLUE =  [0,     0,     191.25, 255];
    let expectedImg = new Array(4 * 4).fill(DK_YELLOW);
    expectedImg[0] = MED_BLUE;
    expectedImg[3] = MED_BLUE;
    expectedImg[12] = MED_BLUE;
    expectedImg[15] = MED_BLUE;
    testResizeSmiley8x8(resizeBilinear, 2, expectedImg);
}

function testResizeBilinearSmiley8x8_3x() {
    const YELLOW_1 = [212.5,  212.5,  0,      255];
    const YELLOW_2 = [191.25, 191.25, 0,      255];
    const BLUE_1 =   [0,      0,      77.916, 255];
    let expectedImg = [
        BLUE_1,   YELLOW_1, BLUE_1,
        YELLOW_1, YELLOW_2, YELLOW_1,
        BLUE_1,   YELLOW_1, BLUE_1,
    ];
    testResizeSmiley8x8(resizeBilinear, 3, expectedImg);
}

function runScalingTests() {
    testResizeBox500x375_21x16();

    testResizeBoxBlack8x8_1x();
    testResizeBoxBlack8x8_1_5x();
    testResizeBoxBlack8x8_2x();
    testResizeBoxBlack8x8_3x();

    testResizeBoxBlack7x5_1x();
    testResizeBoxBlack7x5_1_5x();
    testResizeBoxBlack7x5_2x();
    testResizeBoxBlack7x5_3x();

    testResizeBoxWhite8x8_1x();
    testResizeBoxWhite8x8_1_5x();
    testResizeBoxWhite8x8_2x();
    testResizeBoxWhite8x8_3x();

    testResizeBoxCheckers8x8_1x();
    testResizeBoxCheckers8x8_1_5x();
    testResizeBoxCheckers8x8_2x();
    testResizeBoxCheckers8x8_3x();

    testResizeBoxCheckers7x5_1x();
    testResizeBoxCheckers7x5_1_5x();
    testResizeBoxCheckers7x5_2x();
    testResizeBoxCheckers7x5_3x();

    testResizeBoxLine8x8_1x();
    testResizeBoxLine8x8_1_5x();
    testResizeBoxLine8x8_2x();
    testResizeBoxLine8x8_3x();

    testResizeBoxLine7x5_1x();
    testResizeBoxLine7x5_1_5x();
    testResizeBoxLine7x5_2x();
    testResizeBoxLine7x5_3x();

    testResizeBoxSmiley8x8_1x();
    testResizeBoxSmiley8x8_1_5x();
    testResizeBoxSmiley8x8_2x();
    testResizeBoxSmiley8x8_3x();

    testResizeNNBlack8x8_1x();
    testResizeNNBlack8x8_1_5x();
    testResizeNNBlack8x8_2x();
    testResizeNNBlack8x8_3x();

    testResizeNNWhite8x8_1x();
    testResizeNNWhite8x8_1_5x();
    testResizeNNWhite8x8_2x();
    testResizeNNWhite8x8_3x();

    testResizeNNCheckers8x8_1x();
    testResizeNNCheckers8x8_1_5x();
    testResizeNNCheckers8x8_2x();
    testResizeNNCheckers8x8_3x();

    testResizeNNLine8x8_1x();
    testResizeNNLine8x8_1_5x();
    testResizeNNLine8x8_2x();
    testResizeNNLine8x8_3x();

    testResizeNNSmiley8x8_1x();
    testResizeNNSmiley8x8_1_5x();
    testResizeNNSmiley8x8_2x();
    testResizeNNSmiley8x8_3x();

    testResizeBilinearBlack8x8_1x();
    testResizeBilinearBlack8x8_1_5x();
    testResizeBilinearBlack8x8_2x();
    testResizeBilinearBlack8x8_3x();

    testResizeBilinearWhite8x8_1x();
    testResizeBilinearWhite8x8_1_5x();
    testResizeBilinearWhite8x8_2x();
    testResizeBilinearWhite8x8_3x();

    testResizeBilinearCheckers8x8_1x();
    testResizeBilinearCheckers8x8_1_5x();
    testResizeBilinearCheckers8x8_2x();
    testResizeBilinearCheckers8x8_3x();

    testResizeBilinearLine8x8_1x();
    testResizeBilinearLine8x8_1_5x();
    testResizeBilinearLine8x8_2x();
    testResizeBilinearLine8x8_3x();

    testResizeBilinearSmiley8x8_1x();
    testResizeBilinearSmiley8x8_1_5x();
    testResizeBilinearSmiley8x8_2x();
    testResizeBilinearSmiley8x8_3x();
}