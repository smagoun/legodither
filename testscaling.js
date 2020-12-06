
// value is arbitrary, chosen experimentally
const EPSILON = 0.001

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
    let pixelStride = 4;
    // Prepare source image
    let srcLineStride = srcWidth * pixelStride;
    // Convert our human-friendly(ish) test data to single array of pixel data
    let srcImgData = {};
    srcImgData.data = [];
    for (let i = 0; i < srcData.length; i++) {
        srcImgData.data = srcImgData.data.concat(srcData[i]);
    }
    let srcImgInfo = new ImageInfo(srcWidth, srcHeight, srcLineStride, 
        pixelStride, srcImgData);

    // Prepare dest image. Dest image size should use the same rules
    // as in legodither.js:calculateDestSize()
    let destWidth = Math.round(srcWidth / scaleFactor);
    let destHeight = Math.round(srcHeight / scaleFactor);
    let destLineStride = destWidth * pixelStride;
    let destImgData = {};
    destImgData.data = new Array(destWidth * destHeight * pixelStride).fill(0);
    let destImgInfo = new ImageInfo(destWidth, destHeight, destLineStride,
        pixelStride, destImgData);

    // Resize, ensuring that the scale factor is compatible w/ image dimensions
    // TODO: resize() functions should't need a scale factor at all since they
    // already know src + dest dimensions
    let adjScaleFactor = srcWidth / destWidth;
    fn(srcImgInfo, destImgInfo, adjScaleFactor);

    // Convert our human-friendly(ish) test data to single array of pixel data
    let expectedImgData = {};
    expectedImgData.data = [];
    for (let i = 0; i < expectedData.length; i++) {
        expectedImgData.data = expectedImgData.data.concat(expectedData[i]);
    }

    // Compare
    let dLength = destImgData.data.length;
    let eLength = expectedImgData.data.length;
    if (dLength != eLength) {
        console.error(`dest data size ${dLength} does not match expected ${eLength}`);
    }
    for (let i = 0; i < (destWidth * destHeight * pixelStride); i++) {
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

function testResizeBlack(fn, scaleFactor, expectedImg) {
    testResize(fn, BLACK_8x8, 8, 8, scaleFactor, expectedImg);
}
function testResizeWhite(fn, scaleFactor, expectedImg) {
    testResize(fn, WHITE_8x8, 8, 8, scaleFactor, expectedImg);
}
function testResizeCheckers(fn, scaleFactor, expectedImg) {
    testResize(fn, CHECKERBOARD_BW_8x8, 8, 8, scaleFactor, expectedImg);
}
function testResizeSmiley(fn, scaleFactor, expectedImg) {
    testResize(fn, SMILEY_COLOR_8x8, 8, 8, scaleFactor, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeBoxBlack1x() {
    testResizeBlack(resizeBox, 1, BLACK_8x8);
}
function testResizeBoxBlack1_5x() {
    let expectedImg = new Array(5 * 5).fill(BLACK);
    testResizeBlack(resizeBox, 1.5, expectedImg);
}
function testResizeBoxBlack2x() {
    let expectedImg = new Array(4 * 4).fill(BLACK);
    testResizeBlack(resizeBox, 2, expectedImg);
}
function testResizeBoxBlack3x() {
    let expectedImg = new Array(3 * 3).fill(BLACK);
    testResizeBlack(resizeBox, 2 + 2/3, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeBoxWhite1x() {
    testResizeWhite(resizeBox, 1, WHITE_8x8);
}
function testResizeBoxWhite1_5x() {
    let expectedImg = new Array(5 * 5).fill(WHITE);
    testResizeWhite(resizeBox, 1.5, expectedImg);
}
function testResizeBoxWhite2x() {
    let expectedImg = new Array(4 * 4).fill(WHITE);
    testResizeWhite(resizeBox, 2, expectedImg);
}
function testResizeBoxWhite3x() {
    let expectedImg = new Array(3 * 3).fill(WHITE);
    testResizeWhite(resizeBox, 2 + 2/3, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeBoxCheckers1x() {
    testResizeCheckers(resizeBox, 1, CHECKERBOARD_BW_8x8);
}
function testResizeBoxCheckers1_5x() {
    let expectedImg = [
        DK_GR, DK_GR, GRAY, LT_GR, LT_GR,
        DK_GR, DK_GR, GRAY, LT_GR, LT_GR,
        GRAY,  GRAY,  GRAY, GRAY,  GRAY,
        LT_GR, LT_GR, GRAY, DK_GR, DK_GR,
        LT_GR, LT_GR, GRAY, DK_GR, DK_GR,
    ]
    testResizeCheckers(resizeBox, 1.6, expectedImg);
}
function testResizeBoxCheckers2x() {
    let expectedImg = new Array(4 * 4).fill(GRAY);
    testResizeCheckers(resizeBox, 2, expectedImg);
}
function testResizeBoxCheckers3x() {
    let expectedImg = new Array(3 * 3).fill(GRAY);
    // Corners in the dest are slightly biased since they overlap an odd
    // # of pixels in the src image
    expectedImg[0] = DK_GR;
    expectedImg[2] = LT_GR;
    expectedImg[6] = LT_GR;
    expectedImg[8] = DK_GR;
    testResizeCheckers(resizeBox, 2 + 2/3, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeBoxSmiley1x() {
    testResizeSmiley(resizeBox, 1, SMILEY_COLOR_8x8);
}

function testResizeBoxSmiley1_5x() {
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
    testResizeSmiley(resizeBox, 1.6, expectedImg);
}

function testResizeBoxSmiley2x() {
    const DK_YELLOW = [127.5, 127.5, 0, 255];
    const MED_BLUE = [0, 0, 191.25, 255];
    let expectedImg = new Array(4 * 4).fill(DK_YELLOW);
    expectedImg[0] = MED_BLUE;
    expectedImg[3] = MED_BLUE;
    expectedImg[12] = MED_BLUE;
    expectedImg[15] = MED_BLUE;
    testResizeSmiley(resizeBox, 2, expectedImg);
}

function testResizeBoxSmiley3x() {
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
    testResizeSmiley(resizeBox, 2 + 2/3, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeNNBlack1x() {
    testResizeBlack(resizeNearestNeighbor, 1, BLACK_8x8);
}
function testResizeNNBlack1_5x() {
    let expectedImg = new Array(5 * 5).fill(BLACK);
    testResizeBlack(resizeNearestNeighbor, 1.5, expectedImg);
}
function testResizeNNBlack2x() {
    let expectedImg = new Array(4 * 4).fill(BLACK);
    testResizeBlack(resizeNearestNeighbor, 2, expectedImg);
}
function testResizeNNBlack3x() {
    let expectedImg = new Array(3 * 3).fill(BLACK);
    testResizeBlack(resizeNearestNeighbor, 2 + 2/3, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeNNWhite1x() {
    testResizeWhite(resizeNearestNeighbor, 1, WHITE_8x8);
}
function testResizeNNWhite1_5x() {
    let expectedImg = new Array(5 * 5).fill(WHITE);
    testResizeWhite(resizeNearestNeighbor, 1.5, expectedImg);
}
function testResizeNNWhite2x() {
    let expectedImg = new Array(4 * 4).fill(WHITE);
    testResizeWhite(resizeNearestNeighbor, 2, expectedImg);
}
function testResizeNNWhite3x() {
    let expectedImg = new Array(3 * 3).fill(WHITE);
    testResizeWhite(resizeNearestNeighbor, 2 + 2/3, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeNNCheckers1x() {
    testResizeCheckers(resizeNearestNeighbor, 1, CHECKERBOARD_BW_8x8);
}
function testResizeNNCheckers1_5x() {
    // Src pixels are 0, 2, 4, 5, 7 along both axes: (0,0), (2,2)...(7,7)
    let expectedImg = [
        BLACK, BLACK, BLACK, WHITE, WHITE,
        BLACK, BLACK, BLACK, WHITE, WHITE,
        BLACK, BLACK, BLACK, WHITE, WHITE,
        WHITE, WHITE, WHITE, BLACK, BLACK,
        WHITE, WHITE, WHITE, BLACK, BLACK,
    ];
    testResizeCheckers(resizeNearestNeighbor, 1.6, expectedImg);
}

function testResizeNNCheckers2x() {
    // All black since we're sampling at exactly the frequency of the checkers
    // Src pixels are odd numbers: (1,1), (1,3)...(5,7), (7,7)
    let expectedImg = new Array(4 * 4).fill(BLACK);
    testResizeCheckers(resizeNearestNeighbor, 2, expectedImg);
}

function testResizeNNCheckers3x() {
    let expectedImg = new Array(3 * 3).fill(BLACK);
    // Src pixels are at 1/4/6 along each axis: (1,1), (4,4), (6,6)
    expectedImg[1] = WHITE;
    expectedImg[2] = WHITE;
    expectedImg[3] = WHITE;
    expectedImg[6] = WHITE;
    testResizeCheckers(resizeNearestNeighbor, 2 + 2/3, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeNNSmiley1x() {
    testResizeSmiley(resizeNearestNeighbor, 1, SMILEY_COLOR_8x8);
}

function testResizeNNSmiley1_5x() {
    // Src pixels are 0, 2, 4, 5, 7 along both axes: (0,0), (2,2)...(7,7)
    let expectedImg = [
        BLUE,  BLACK,  BLACK,  BLACK,  BLUE,
        BLACK, BLACK,  BLACK,  YELLOW, BLACK,
        BLACK, YELLOW, YELLOW, BLACK,  BLACK,
        BLACK, BLACK,  BLACK,  YELLOW, BLACK,
        BLUE,  BLACK,  BLACK,  BLACK,  BLUE,
    ];
    testResizeSmiley(resizeNearestNeighbor, 1.6, expectedImg);
}

function testResizeNNSmiley2x() {
    // Src pixels are odd numbers: (1,1), (1,3)...(5,7), (7,7)
    let expectedImg = [
        BLACK,  YELLOW, YELLOW, BLUE,
        YELLOW, YELLOW, YELLOW, BLACK,
        YELLOW, BLACK,  YELLOW, BLACK,
        BLUE,   BLACK,  BLACK,  BLUE,
    ];
    testResizeSmiley(resizeNearestNeighbor, 2, expectedImg);
}

function testResizeNNSmiley3x() {
    // Src pixels are at 1/4/6 along each axis: (1,1), (4,4), (6,6)
    let expectedImg = [
        BLACK,  YELLOW, BLACK,
        YELLOW, YELLOW, YELLOW,
        BLACK,  YELLOW, BLACK,
    ];
    testResizeSmiley(resizeNearestNeighbor, 2 + 2/3, expectedImg);
}

function runScalingTests() {
    testResizeBoxBlack1x();
    testResizeBoxBlack1_5x();
    testResizeBoxBlack2x();
    testResizeBoxBlack3x();

    testResizeBoxWhite1x();
    testResizeBoxWhite1_5x();
    testResizeBoxWhite2x();
    testResizeBoxWhite3x();

    testResizeBoxCheckers1x();
    testResizeBoxCheckers1_5x();
    testResizeBoxCheckers2x();
    testResizeBoxCheckers3x();

    testResizeBoxSmiley1x();
    testResizeBoxSmiley1_5x();
    testResizeBoxSmiley2x();
    testResizeBoxSmiley3x();

    testResizeNNBlack1x();
    testResizeNNBlack1_5x();
    testResizeNNBlack2x();
    testResizeNNBlack3x();

    testResizeNNWhite1x();
    testResizeNNWhite1_5x();
    testResizeNNWhite2x();
    testResizeNNWhite3x();

    testResizeNNCheckers1x();
    testResizeNNCheckers1_5x();
    testResizeNNCheckers2x();
    testResizeNNCheckers3x();

    testResizeNNSmiley1x();
    testResizeNNSmiley1_5x();
    testResizeNNSmiley2x();
    testResizeNNSmiley3x();

}