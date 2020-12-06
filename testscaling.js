
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
        if (Math.abs(destImgData.data[i] - expectedImgData.data[i]) > EPSILON) {
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

/**
 * Identity resize; should be a NOP
 */
function testResizeBoxBlack1x() {
    let fn = resizeBox;
    let srcImg = BLACK_8x8;
    let srcWidth = 8, srcHeight = 8;
    let expectedImg = BLACK_8x8;
    let scaleFactor = 1;
    testResize(fn, srcImg, srcWidth, srcHeight, scaleFactor, expectedImg);
}

function testResizeBoxBlack1_5x() {
    let fn = resizeBox;
    let srcImg = BLACK_8x8;
    let srcWidth = 8, srcHeight = 8;
    let expectedImg = new Array(5 * 5).fill(BLACK);
    let scaleFactor = 1.5;
    testResize(fn, srcImg, srcWidth, srcHeight, scaleFactor, expectedImg);
}

function testResizeBoxBlack2x() {
    let fn = resizeBox;
    let srcImg = BLACK_8x8;
    let srcWidth = 8, srcHeight = 8;
    let expectedImg = new Array(4 * 4).fill(BLACK);
    let scaleFactor = 2;
    testResize(fn, srcImg, srcWidth, srcHeight, scaleFactor, expectedImg);
}

function testResizeBoxBlack3x() {
    let fn = resizeBox;
    let srcImg = BLACK_8x8;
    let srcWidth = 8, srcHeight = 8;
    let expectedImg = new Array(3 * 3).fill(BLACK);
    let scaleFactor = 2 + 2/3;
    testResize(fn, srcImg, srcWidth, srcHeight, scaleFactor, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeBoxWhite1x() {
    let fn = resizeBox;
    let srcImg = WHITE_8x8;
    let srcWidth = 8, srcHeight = 8;
    let expectedImg = WHITE_8x8;
    let scaleFactor = 1;
    testResize(fn, srcImg, srcWidth, srcHeight, scaleFactor, expectedImg);
}

function testResizeBoxWhite1_5x() {
    let fn = resizeBox;
    let srcImg = WHITE_8x8;
    let srcWidth = 8, srcHeight = 8;
    let expectedImg = new Array(5 * 5).fill(WHITE);
    let scaleFactor = 1.5;
    testResize(fn, srcImg, srcWidth, srcHeight, scaleFactor, expectedImg);
}

function testResizeBoxWhite2x() {
    let fn = resizeBox;
    let srcImg = WHITE_8x8;
    let srcWidth = 8, srcHeight = 8;
    let expectedImg = new Array(4 * 4).fill(WHITE);
    let scaleFactor = 2;
    testResize(fn, srcImg, srcWidth, srcHeight, scaleFactor, expectedImg);
}

function testResizeBoxWhite3x() {
    let fn = resizeBox;
    let srcImg = WHITE_8x8;
    let srcWidth = 8, srcHeight = 8;
    let expectedImg = new Array(3 * 3).fill(WHITE);
    let scaleFactor = 2 + 2/3;
    testResize(fn, srcImg, srcWidth, srcHeight, scaleFactor, expectedImg);
}


/**
 * Identity resize; should be a NOP
 */
function testResizeBoxCheckers1x() {
    let fn = resizeBox;
    let srcImg = CHECKERBOARD_BW_8x8;
    let srcWidth = 8, srcHeight = 8;
    let expectedImg = CHECKERBOARD_BW_8x8;
    let scaleFactor = 1;
    testResize(fn, srcImg, srcWidth, srcHeight, scaleFactor, expectedImg);
}

function testResizeBoxCheckers1_5x() {
    let fn = resizeBox;
    let srcImg = CHECKERBOARD_BW_8x8;
    let srcWidth = 8, srcHeight = 8;
    let expectedImg = new Array(5 * 5).fill(GRAY);
    expectedImg = [
        DK_GR, DK_GR, GRAY, LT_GR, LT_GR,
        DK_GR, DK_GR, GRAY, LT_GR, LT_GR,
        GRAY,  GRAY,  GRAY, GRAY,  GRAY,
        LT_GR, LT_GR, GRAY, DK_GR, DK_GR,
        LT_GR, LT_GR, GRAY, DK_GR, DK_GR,
    ]
    let scaleFactor = 1.6;
    testResize(fn, srcImg, srcWidth, srcHeight, scaleFactor, expectedImg);
}

function testResizeBoxCheckers2x() {
    let fn = resizeBox;
    let srcImg = CHECKERBOARD_BW_8x8;
    let srcWidth = 8, srcHeight = 8;
    let expectedImg = new Array(4 * 4).fill(GRAY);
    let scaleFactor = 2;
    testResize(fn, srcImg, srcWidth, srcHeight, scaleFactor, expectedImg);
}

function testResizeBoxCheckers3x() {
    let fn = resizeBox;
    let srcImg = CHECKERBOARD_BW_8x8;
    let srcWidth = 8, srcHeight = 8;
    let expectedImg = new Array(3 * 3).fill(GRAY);
    // Corners in the dest are slightly biased since they overlap an odd
    // # of pixels in the src image
    expectedImg[0] = DK_GR;
    expectedImg[2] = LT_GR;
    expectedImg[6] = LT_GR;
    expectedImg[8] = DK_GR;
    let scaleFactor = 2 + 2/3;
    testResize(fn, srcImg, srcWidth, srcHeight, scaleFactor, expectedImg);
}

/**
 * Identity resize; should be a NOP
 */
function testResizeBoxSmiley1x() {
    let fn = resizeBox;
    let srcImg = SMILEY_COLOR_8x8;
    let srcWidth = 8, srcHeight = 8;
    let expectedImg = SMILEY_COLOR_8x8;
    let scaleFactor = 1;
    testResize(fn, srcImg, srcWidth, srcHeight, scaleFactor, expectedImg);
}

function testResizeBoxSmiley1_5x() {
    let fn = resizeBox;
    let srcImg = SMILEY_COLOR_8x8;
    let srcWidth = 8, srcHeight = 8;
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
    let scaleFactor = 1.6;
    testResize(fn, srcImg, srcWidth, srcHeight, scaleFactor, expectedImg);
}

function testResizeBoxSmiley2x() {
    let fn = resizeBox;
    let srcImg = SMILEY_COLOR_8x8;
    let srcWidth = 8, srcHeight = 8;
    const DK_YELLOW = [127.5, 127.5, 0, 255];
    const MED_BLUE = [0, 0, 191.25, 255];
    let expectedImg = new Array(4 * 4).fill(DK_YELLOW);
    expectedImg[0] = MED_BLUE;
    expectedImg[3] = MED_BLUE;
    expectedImg[12] = MED_BLUE;
    expectedImg[15] = MED_BLUE;
    let scaleFactor = 2;
    testResize(fn, srcImg, srcWidth, srcHeight, scaleFactor, expectedImg);
}

function testResizeBoxSmiley3x() {
    let fn = resizeBox;
    let srcImg = SMILEY_COLOR_8x8;
    let srcWidth = 8, srcHeight = 8;
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
    let scaleFactor = 2 + 2/3;
    testResize(fn, srcImg, srcWidth, srcHeight, scaleFactor, expectedImg);
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
}