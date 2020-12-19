
const TESTBOM_IMG_WIDTH = 4;
const TESTBOM_IMG_HEIGHT = 4;
const TESTBOM_IMG_PIXELSTRIDE = 4;    // RGBA
const TESTBOM_RED = [255, 0, 0, 255];   // ■
const TESTBOM_BLUE = [0, 0, 255, 255];  // □

/**
 * Create a new mock ImageInfo with the pixels set to the values in the imgSpec string.
 * imgSpec contains a human-readable text representation of the pixels in the image using
 * special characters to represent red pixels (■) and blue pixels (□). Other than these
 * characters, imgSpec may only contain whitespace.
 * 
 * Example imgSpec representation of a 4x2 image composed of two lines, one of all red
 * pixels and one of all blue pixels:
 * ■ ■ ■ ■
 * □ □ □ □
 * 
 * @param {*} imgSpec String representation of the pixels in the image
 * @param {*} width Width of the image to create. Defaults to TESTBOM_IMG_WIDTH
 * @param {*} height Height of the image to create. Defaults to TESTBOM_IMG_HEIGHT
 */
function newTestImage(imgSpec, width = TESTBOM_IMG_WIDTH, height = TESTBOM_IMG_HEIGHT) {
    const imageData = {};
    imageData.data = new Array(width * height * TESTBOM_IMG_PIXELSTRIDE);
    const img = new ImageInfo(width, height, width * TESTBOM_IMG_PIXELSTRIDE,
        TESTBOM_IMG_PIXELSTRIDE, imageData);

    imgSpec = imgSpec.replace(/\s+/g, '');  // Remove all whitespace
    if ((imgSpec.length) != (width * height)) {
        console.error(`Broken test: imgSpec string the wrong length (expected ${width*height}, got ${imgSpec.length})`);
        return undefined;
    }
    let index = 0;
    let chars = Array.from(imgSpec);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let char = chars[index++];
            if (char === '■') {
                img.setPixel(x, y, TESTBOM_RED);
            } else if(char === '□') {
                img.setPixel(x, y, TESTBOM_BLUE);
            } else {
                console.error(`Broken test: invalid character ${char} in imgSpec string`);
            }
        }
    }
    return img;
}

/**
 * Returns an array of test cases images. Each item is an object
 * containing the test's name and the pixel grid of the image.
 */
function generateTestImages() {
    let images = [];
    let img;
    let imgSpec;
    let name;

    name = "Line that's all the same color"
    imgSpec = `■ ■ ■ ■`;
    img = newTestImage(imgSpec, TESTBOM_IMG_WIDTH, 1);
    images.push({name: name, image: img});

    name = "Line with multiple colors"
    imgSpec = `■ ■ □ □`;
    img = newTestImage(imgSpec, TESTBOM_IMG_WIDTH, 1);
    images.push({name: name, image: img});

    name = "Line whose last pixel is its own color"
    imgSpec = `■ ■ ■ □`;
    img = newTestImage(imgSpec, TESTBOM_IMG_WIDTH, 1);
    images.push({name: name, image: img});

    name = "Alternating colors"
    imgSpec = `■ □ ■ □`;
    img = newTestImage(imgSpec, TESTBOM_IMG_WIDTH, 1);
    images.push({name: name, image: img});

    name = "4x4 grid of one color";
    imgSpec = `
    ■ ■ ■ ■
    ■ ■ ■ ■
    ■ ■ ■ ■
    ■ ■ ■ ■`;
    img = newTestImage(imgSpec);
    images.push({name: name, image: img});

    name = "4x2 on top, 4x2 on bottom"
    imgSpec = `
    ■ ■ ■ ■
    ■ ■ ■ ■
    □ □ □ □
    □ □ □ □`;
    img = newTestImage(imgSpec);
    images.push({name: name, image: img});

    name = "Right triangle with corner at top left"
    imgSpec = `
    ■ ■ ■ ■
    ■ ■ ■ □
    ■ ■ □ □
    ■ □ □ □`;
    img = newTestImage(imgSpec);
    images.push({name: name, image: img});

    name = "Right triangle with corner at top right"
    imgSpec = `
    □ □ □ □
    ■ □ □ □
    ■ ■ □ □
    ■ ■ ■ □`;
    img = newTestImage(imgSpec);
    images.push({name: name, image: img});

    name = "Line that's all the same color"
    imgSpec = `
    ■ ■ ■ ■
    □ □ □ □
    □ □ □ □
    □ □ □ □`;
    img = newTestImage(imgSpec);
    images.push({name: name, image: img});

    name = "DCT-ish image"
    imgSpec = `
    ■ ■ □ ■
    ■ ■ □ ■
    □ □ ■ □
    ■ ■ □ ■`;
    img = newTestImage(imgSpec);
    images.push({name: name, image: img});

    name = "Real estate sign"
    imgSpec = `
    □ ■ □ □
    ■ ■ ■ ■
    □ ■ ■ ■
    □ ■ □ □`;
    img = newTestImage(imgSpec);
    images.push({name: name, image: img});

    name = "Backward L"
    imgSpec = `
    □ □ ■ □
    □ □ ■ □
    ■ ■ ■ □
    □ □ □ □`;
    img = newTestImage(imgSpec);
    images.push({name: name, image: img});

    return images;
}

function checkBricks(a, b) {
    if (a.length === b.length) {
        for (let i = 0; i < a.length; i++) {
            if (a[i] instanceof Brick && b[i] instanceof Brick) {
                if (!a[i].isComplete() || !b[i].isComplete()) {
                    return false;
                }
                if (!a[i].isEqual(b[i])) {
                    return false;
                }
            } else if (a[i] != b[i]) {
                return false;
            }
        }
        return true;
    }
    return false;
}

function testFindOptimalBricks(x, y, width, height, color, expectedCost, expectedBricks) {
    ret = true;
    const {cost, bricks} = findOptimalBricks(new Rect(x, y, width, height, color));
    if (cost != expectedCost) {
        console.error(`${width}x${height} cost: ${cost}, expected: ${expectedCost}`);
        ret = false;
    }
    if (!checkBricks(bricks, expectedBricks)) {
        console.error(`${width}x${height} got bricks ${bricks}, expected: ${expectedBricks}`);
        ret = false;
    }
    return ret;
}

function testFindRectsSinglePixels() {
    let fn = findRectsSinglePixels;
    let errCnt = 0;
    let testCnt = 0;
    let expected;
    let testName;

    let iter = generateTestImages().values();
    let info;

    testName = "Line that's all the same color"
    // ■ ■ ■ ■
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    for (let i = 0; i < TESTBOM_IMG_WIDTH; i++) {   
        expected.push(new Rect(i, 0, 1, 1, TESTBOM_RED))
    }
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Line with multiple colors"
    // ■ ■ □ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 1, 1, TESTBOM_RED));
    expected.push(new Rect(1, 0, 1, 1, TESTBOM_RED));
    expected.push(new Rect(2, 0, 1, 1, TESTBOM_BLUE));
    expected.push(new Rect(3, 0, 1, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Line whose last pixel is its own color"
    // ■ ■ ■ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 1, 1, TESTBOM_RED));
    expected.push(new Rect(1, 0, 1, 1, TESTBOM_RED));
    expected.push(new Rect(2, 0, 1, 1, TESTBOM_RED));
    expected.push(new Rect(3, 0, 1, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Alternating colors"
    // ■ □ ■ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 1, 1, TESTBOM_RED));
    expected.push(new Rect(1, 0, 1, 1, TESTBOM_BLUE));
    expected.push(new Rect(2, 0, 1, 1, TESTBOM_RED));
    expected.push(new Rect(3, 0, 1, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    // Bail here even though there are more test cases defined; they don't cover much new ground

    if (errCnt === 0) {
        console.log(`${fn.name}: ${testCnt}/${testCnt} tests passed!`);
    } else {
        console.warn(`${fn.name}: tests failed (${testCnt - errCnt} passed, ${errCnt} failures)`);
    }

}

function testFindRectsSingleLine() {
    let fn = findRectsSingleLine;
    let errCnt = 0;
    let testCnt = 0;
    let expected;
    let testName;

    let iter = generateTestImages().values();
    let info;

    testName = "Line that's all the same color"
    // ■ ■ ■ ■
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, TESTBOM_IMG_WIDTH, 1, TESTBOM_RED));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Line with multiple colors"
    // ■ ■ □ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 2, 1, TESTBOM_RED));
    expected.push(new Rect(2, 0, 2, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Line whose last pixel is its own color"
    // ■ ■ ■ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 3, 1, TESTBOM_RED));
    expected.push(new Rect(3, 0, 1, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Alternating colors"
    // ■ □ ■ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 1, 1, TESTBOM_RED));
    expected.push(new Rect(1, 0, 1, 1, TESTBOM_BLUE));
    expected.push(new Rect(2, 0, 1, 1, TESTBOM_RED));
    expected.push(new Rect(3, 0, 1, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    // Bail here even though there are more test cases defined; they don't cover much new ground

    if (errCnt === 0) {
        console.log(`${fn.name}: ${testCnt}/${testCnt} tests passed!`);
    } else {
        console.warn(`${fn.name}: tests failed (${testCnt - errCnt} passed, ${errCnt} failures)`);
    }
}

function testOneImg(img, fn, testName, expected, testCnt) {
    let rects = fn(img);
    let errCnt = 0;
    if (rects.length === expected.length) {
        for (let i = 0; i < rects.length && errCnt === 0; i++) {
            const a = rects[i];
            const b = expected[i];
            if (a.x != b.x || a.y != b.y || a.width != b.width || a.height != b.height) {
                errCnt = 1;
                break;
            }
            if (a.color === undefined) {
                errCnt = 1;
                break;
            }
            for (let j = 0; j < a.color.length; j++) {
                if (a.color[j] != b.color[j]) {
                    errCnt = 1;
                    break;
                }
            }
        }
    } else {
        errCnt++;
    }
    if (errCnt > 0) {
        console.error(`${fn.name} test ${testCnt}: "${testName}" expected ${JSON.stringify(expected)}, 
            got ${JSON.stringify(rects)}`);
    }
    return errCnt;
}

function testFindRectsMultiLine() {
    let fn = findRectsMultiLine;
    let errCnt = 0;
    let testCnt = 0;
    let expected;
    let testName;

    let iter = generateTestImages().values();
    let info;

    testName = "Line that's all the same color"
    // ■ ■ ■ ■
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, TESTBOM_IMG_WIDTH, 1, TESTBOM_RED));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Line with multiple colors"
    // ■ ■ □ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 2, 1, TESTBOM_RED));
    expected.push(new Rect(2, 0, 2, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Line whose last pixel is its own color"
    // ■ ■ ■ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 3, 1, TESTBOM_RED));
    expected.push(new Rect(3, 0, 1, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Alternating colors"
    // ■ □ ■ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 1, 1, TESTBOM_RED));
    expected.push(new Rect(1, 0, 1, 1, TESTBOM_BLUE));
    expected.push(new Rect(2, 0, 1, 1, TESTBOM_RED));
    expected.push(new Rect(3, 0, 1, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "4x4 grid of one color"
    // ■ ■ ■ ■
    // ■ ■ ■ ■
    // ■ ■ ■ ■
    // ■ ■ ■ ■
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 4, 4, TESTBOM_RED));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "4x2 on top, 4x2 on bottom"
    // ■ ■ ■ ■
    // ■ ■ ■ ■
    // □ □ □ □
    // □ □ □ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 4, 2, TESTBOM_RED));
    expected.push(new Rect(0, 2, 4, 2, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Right triangle with corner at top left"
    // ■ ■ ■ ■
    // ■ ■ ■ □
    // ■ ■ □ □
    // ■ □ □ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 4, 1, TESTBOM_RED));
    expected.push(new Rect(0, 1, 3, 1, TESTBOM_RED));
    expected.push(new Rect(0, 2, 2, 1, TESTBOM_RED));
    expected.push(new Rect(0, 3, 1, 1, TESTBOM_RED));
    expected.push(new Rect(1, 3, 3, 1, TESTBOM_BLUE));
    expected.push(new Rect(2, 2, 2, 1, TESTBOM_BLUE));
    expected.push(new Rect(3, 1, 1, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Right triangle with corner at top right"
    // □ □ □ □
    // ■ □ □ □
    // ■ ■ □ □
    // ■ ■ ■ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 4, 1, TESTBOM_BLUE));
    expected.push(new Rect(0, 1, 1, 1, TESTBOM_RED));
    expected.push(new Rect(0, 2, 2, 1, TESTBOM_RED));
    expected.push(new Rect(0, 3, 3, 1, TESTBOM_RED));
    expected.push(new Rect(1, 1, 3, 1, TESTBOM_BLUE));
    expected.push(new Rect(2, 2, 2, 1, TESTBOM_BLUE));
    expected.push(new Rect(3, 3, 1, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Line that's all the same color"
    // ■ ■ ■ ■
    // □ □ □ □
    // □ □ □ □
    // □ □ □ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 4, 1, TESTBOM_RED));
    expected.push(new Rect(0, 1, 4, 3, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "DCT-ish image"
    // ■ ■ □ ■
    // ■ ■ □ ■
    // □ □ ■ □
    // ■ ■ □ ■
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    // 1st 2 columns
    expected.push(new Rect(0, 0, 2, 2, TESTBOM_RED));
    expected.push(new Rect(0, 2, 2, 1, TESTBOM_BLUE));
    expected.push(new Rect(0, 3, 2, 1, TESTBOM_RED));
    // 3rd column
    expected.push(new Rect(2, 0, 1, 2, TESTBOM_BLUE));
    expected.push(new Rect(2, 2, 1, 1, TESTBOM_RED));
    expected.push(new Rect(2, 3, 1, 1, TESTBOM_BLUE));
    // Last column
    expected.push(new Rect(3, 0, 1, 2, TESTBOM_RED));
    expected.push(new Rect(3, 2, 1, 1, TESTBOM_BLUE));
    expected.push(new Rect(3, 3, 1, 1, TESTBOM_RED));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Real estate sign"
    // □ ■ □ □
    // ■ ■ ■ ■
    // □ ■ ■ ■
    // □ ■ □ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 1, 1, TESTBOM_BLUE));
    expected.push(new Rect(0, 1, 4, 1, TESTBOM_RED));
    expected.push(new Rect(0, 2, 1, 2, TESTBOM_BLUE));
    expected.push(new Rect(1, 0, 1, 1, TESTBOM_RED));
    expected.push(new Rect(1, 2, 3, 1, TESTBOM_RED));
    expected.push(new Rect(1, 3, 1, 1, TESTBOM_RED));
    expected.push(new Rect(2, 0, 2, 1, TESTBOM_BLUE));
    expected.push(new Rect(2, 3, 2, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Backward L"
    // □ □ ■ □
    // □ □ ■ □
    // ■ ■ ■ □
    // □ □ □ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 2, 2, TESTBOM_BLUE));
    expected.push(new Rect(0, 2, 3, 1, TESTBOM_RED));
    expected.push(new Rect(0, 3, 4, 1, TESTBOM_BLUE));
    expected.push(new Rect(2, 0, 1, 2, TESTBOM_RED));
    expected.push(new Rect(3, 0, 1, 3, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    if (errCnt === 0) {
        console.log(`${fn.name}: ${testCnt}/${testCnt} tests passed!`);
    } else {
        console.warn(`${fn.name}: tests failed (${testCnt - errCnt} passed, ${errCnt} failures)`);
    }
}

function testFindRectsExpanding() {
    let fn = findRectsExpanding;
    let errCnt = 0;
    let testCnt = 0;
    let expected;
    let testName;

    let iter = generateTestImages().values();
    let info;

    testName = "Line that's all the same color"
    // ■ ■ ■ ■
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, TESTBOM_IMG_WIDTH, 1, TESTBOM_RED));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Line with multiple colors"
    // ■ ■ □ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 2, 1, TESTBOM_RED));
    expected.push(new Rect(2, 0, 2, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Line whose last pixel is its own color"
    // ■ ■ ■ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 3, 1, TESTBOM_RED));
    expected.push(new Rect(3, 0, 1, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Alternating colors"
    // ■ □ ■ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 1, 1, TESTBOM_RED));
    expected.push(new Rect(1, 0, 1, 1, TESTBOM_BLUE));
    expected.push(new Rect(2, 0, 1, 1, TESTBOM_RED));
    expected.push(new Rect(3, 0, 1, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "4x4 grid of one color"
    // ■ ■ ■ ■
    // ■ ■ ■ ■
    // ■ ■ ■ ■
    // ■ ■ ■ ■
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 4, 4, TESTBOM_RED));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "4x2 on top, 4x2 on bottom"
    // ■ ■ ■ ■
    // ■ ■ ■ ■
    // □ □ □ □
    // □ □ □ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 4, 2, TESTBOM_RED));
    expected.push(new Rect(0, 2, 4, 2, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Right triangle with corner at top left"
    // ■ ■ ■ ■
    // ■ ■ ■ □
    // ■ ■ □ □
    // ■ □ □ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 3, 2, TESTBOM_RED));
    expected.push(new Rect(3, 0, 1, 1, TESTBOM_RED));
    expected.push(new Rect(3, 1, 1, 3, TESTBOM_BLUE));
    expected.push(new Rect(0, 2, 2, 1, TESTBOM_RED));
    expected.push(new Rect(2, 2, 1, 2, TESTBOM_BLUE));
    expected.push(new Rect(0, 3, 1, 1, TESTBOM_RED));
    expected.push(new Rect(1, 3, 1, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Right triangle with corner at top right"
    // □ □ □ □
    // ■ □ □ □
    // ■ ■ □ □
    // ■ ■ ■ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 4, 1, TESTBOM_BLUE));
    expected.push(new Rect(0, 1, 1, 3, TESTBOM_RED));
    expected.push(new Rect(1, 1, 3, 1, TESTBOM_BLUE));
    expected.push(new Rect(1, 2, 1, 2, TESTBOM_RED));
    expected.push(new Rect(2, 2, 2, 1, TESTBOM_BLUE));
    expected.push(new Rect(2, 3, 1, 1, TESTBOM_RED));
    expected.push(new Rect(3, 3, 1, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Line that's all the same color"
    // ■ ■ ■ ■
    // □ □ □ □
    // □ □ □ □
    // □ □ □ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 4, 1, TESTBOM_RED));
    expected.push(new Rect(0, 1, 4, 3, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "DCT-ish image"
    // ■ ■ □ ■
    // ■ ■ □ ■
    // □ □ ■ □
    // ■ ■ □ ■
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    // First 2 rows
    expected.push(new Rect(0, 0, 2, 2, TESTBOM_RED));
    expected.push(new Rect(2, 0, 1, 2, TESTBOM_BLUE));
    expected.push(new Rect(3, 0, 1, 2, TESTBOM_RED));
    // 3rd row
    expected.push(new Rect(0, 2, 2, 1, TESTBOM_BLUE));
    expected.push(new Rect(2, 2, 1, 1, TESTBOM_RED));
    expected.push(new Rect(3, 2, 1, 1, TESTBOM_BLUE));
    // Last row
    expected.push(new Rect(0, 3, 2, 1, TESTBOM_RED));
    expected.push(new Rect(2, 3, 1, 1, TESTBOM_BLUE));
    expected.push(new Rect(3, 3, 1, 1, TESTBOM_RED));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Real estate sign"
    // □ ■ □ □
    // ■ ■ ■ ■
    // □ ■ ■ ■
    // □ ■ □ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 1, 1, TESTBOM_BLUE));
    expected.push(new Rect(1, 0, 1, 4, TESTBOM_RED));
    expected.push(new Rect(2, 0, 2, 1, TESTBOM_BLUE));
    expected.push(new Rect(0, 1, 1, 1, TESTBOM_RED));
    expected.push(new Rect(2, 1, 2, 2, TESTBOM_RED));
    expected.push(new Rect(0, 2, 1, 2, TESTBOM_BLUE));
    expected.push(new Rect(2, 3, 2, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Backward L"
    // □ □ ■ □
    // □ □ ■ □
    // ■ ■ ■ □
    // □ □ □ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 2, 2, TESTBOM_BLUE));
    expected.push(new Rect(2, 0, 1, 3, TESTBOM_RED));
    expected.push(new Rect(3, 0, 1, 4, TESTBOM_BLUE));
    expected.push(new Rect(0, 2, 2, 1, TESTBOM_RED));
    expected.push(new Rect(0, 3, 3, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    if (errCnt === 0) {
        console.log(`${fn.name}: ${testCnt}/${testCnt} tests passed!`);
    } else {
        console.warn(`${fn.name}: tests failed (${testCnt - errCnt} passed, ${errCnt} failures)`);
    }
}

function testFindRectsLowCPSFirst() {
    let fn = findRectsLowCPSFirst;
    let errCnt = 0;
    let testCnt = 0;
    let expected;
    let testName;

    let iter = generateTestImages().values();
    let info;

    testName = "Line that's all the same color"
    // ■ ■ ■ ■
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    // In our test data, a 3x1 is cheaper per-stud ($0.0233/stud) than a 4x1 $(0.025/stud)
    // so the 3x1 will be placed before we try a 4x1
    expected.push(new Rect(0, 0, 3, 1, TESTBOM_RED));
    expected.push(new Rect(3, 0, 1, 1, TESTBOM_RED));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Line with multiple colors"
    // ■ ■ □ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 2, 1, TESTBOM_RED));
    expected.push(new Rect(2, 0, 2, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Line whose last pixel is its own color"
    // ■ ■ ■ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 3, 1, TESTBOM_RED));
    expected.push(new Rect(3, 0, 1, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Alternating colors"
    // ■ □ ■ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 1, 1, TESTBOM_RED));
    expected.push(new Rect(1, 0, 1, 1, TESTBOM_BLUE));
    expected.push(new Rect(2, 0, 1, 1, TESTBOM_RED));
    expected.push(new Rect(3, 0, 1, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "4x4 grid of one color"
    // ■ ■ ■ ■
    // ■ ■ ■ ■
    // ■ ■ ■ ■
    // ■ ■ ■ ■
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 4, 4, TESTBOM_RED));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "4x2 on top, 4x2 on bottom"
    // ■ ■ ■ ■
    // ■ ■ ■ ■
    // □ □ □ □
    // □ □ □ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 4, 2, TESTBOM_RED));
    expected.push(new Rect(0, 2, 4, 2, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Right triangle with corner at top left"
    // ■ ■ ■ ■
    // ■ ■ ■ □
    // ■ ■ □ □
    // ■ □ □ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 0, 2, 3, TESTBOM_RED));
    expected.push(new Rect(3, 1, 1, 3, TESTBOM_BLUE));
    expected.push(new Rect(2, 0, 1, 2, TESTBOM_RED));
    expected.push(new Rect(2, 2, 1, 2, TESTBOM_BLUE));
    expected.push(new Rect(3, 0, 1, 1, TESTBOM_RED));
    expected.push(new Rect(0, 3, 1, 1, TESTBOM_RED));
    expected.push(new Rect(1, 3, 1, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);    

    testName = "Right triangle with corner at top right"
    // □ □ □ □
    // ■ □ □ □
    // ■ ■ □ □
    // ■ ■ ■ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(2, 0, 2, 3, TESTBOM_BLUE));
    expected.push(new Rect(0, 1, 1, 3, TESTBOM_RED));
    expected.push(new Rect(1, 0, 1, 2, TESTBOM_BLUE));
    expected.push(new Rect(1, 2, 1, 2, TESTBOM_RED));
    expected.push(new Rect(0, 0, 1, 1, TESTBOM_BLUE));
    expected.push(new Rect(2, 3, 1, 1, TESTBOM_RED));
    expected.push(new Rect(3, 3, 1, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Line that's all the same color"
    // ■ ■ ■ ■
    // □ □ □ □
    // □ □ □ □
    // □ □ □ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(0, 1, 4, 2, TESTBOM_BLUE));
    expected.push(new Rect(0, 0, 3, 1, TESTBOM_RED));
    expected.push(new Rect(0, 3, 3, 1, TESTBOM_BLUE));
    expected.push(new Rect(3, 0, 1, 1, TESTBOM_RED));
    expected.push(new Rect(3, 3, 1, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "DCT-ish image"
    // ■ ■ □ ■
    // ■ ■ □ ■
    // □ □ ■ □
    // ■ ■ □ ■
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    // Top-left square
    expected.push(new Rect(0, 0, 2, 2, TESTBOM_RED));
    // Top-right square
    expected.push(new Rect(2, 0, 1, 2, TESTBOM_BLUE));
    expected.push(new Rect(3, 0, 1, 2, TESTBOM_RED));
    // Bottom-left square
    expected.push(new Rect(0, 2, 2, 1, TESTBOM_BLUE));
    expected.push(new Rect(0, 3, 2, 1, TESTBOM_RED));
    // Bottom-right square
    expected.push(new Rect(2, 2, 1, 1, TESTBOM_RED));
    expected.push(new Rect(3, 2, 1, 1, TESTBOM_BLUE));
    expected.push(new Rect(2, 3, 1, 1, TESTBOM_BLUE));
    expected.push(new Rect(3, 3, 1, 1, TESTBOM_RED));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Real estate sign"
    // □ ■ □ □
    // ■ ■ ■ ■
    // □ ■ ■ ■
    // □ ■ □ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(1, 1, 3, 2, TESTBOM_RED));
    expected.push(new Rect(0, 2, 1, 2, TESTBOM_BLUE));
    expected.push(new Rect(2, 0, 2, 1, TESTBOM_BLUE));
    expected.push(new Rect(2, 3, 2, 1, TESTBOM_BLUE));
    expected.push(new Rect(0, 0, 1, 1, TESTBOM_BLUE));
    expected.push(new Rect(1, 0, 1, 1, TESTBOM_RED));
    expected.push(new Rect(0, 1, 1, 1, TESTBOM_RED));
    expected.push(new Rect(1, 3, 1, 1, TESTBOM_RED));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    testName = "Backward L"
    // □ □ ■ □
    // □ □ ■ □
    // ■ ■ ■ □
    // □ □ □ □
    info = iter.next().value;
    if (testName != info.name) console.error(`Test case mismatch: expected ${testName}, got ${info.name}`);
    expected = [];
    expected.push(new Rect(2, 0, 1, 3, TESTBOM_RED));
    expected.push(new Rect(3, 0, 1, 3, TESTBOM_BLUE));
    expected.push(new Rect(0, 3, 3, 1, TESTBOM_BLUE));
    expected.push(new Rect(0, 0, 2, 2, TESTBOM_BLUE));
    expected.push(new Rect(0, 2, 2, 1, TESTBOM_RED));
    expected.push(new Rect(3, 3, 1, 1, TESTBOM_BLUE));
    errCnt += testOneImg(info.image, fn, testName, expected, ++testCnt);

    if (errCnt === 0) {
        console.log(`${fn.name}: ${testCnt}/${testCnt} tests passed!`);
    } else {
        console.warn(`${fn.name}: tests failed (${testCnt - errCnt} passed, ${errCnt} failures)`);
    }
}

function testFindBricks() {
    let testCnt = 0;
    let errCnt = 0;

    let expectedCost;
    let expectedBricks = [];
    let x, y, width, height;
    const color = [0, 0, 0, 0];

    // Base case: 0x0
    testCnt++;
    width=0, height=0, x=0, y=0, expectedCost=0, expectedBricks=[new Brick(0, 0, 0, color, 0, 0)];
    if (!testFindOptimalBricks(x, y, width, height, color, expectedCost, expectedBricks)) {
        errCnt++;
    }

    // 1x1
    testCnt++;
    width=1, height=1, x=0, y=0, expectedCost=6, expectedBricks=[new Brick(1, 1, 6, color, 0, 0)];
    if (!testFindOptimalBricks(x, y, width, height, color, expectedCost, expectedBricks)) {
        errCnt++;
    }

    // Longer brick
    testCnt++;
    width=4, height=1, x=0, y=0, expectedCost=10, expectedBricks=[new Brick(4, 1, 10, color, 0, 0)];
    if (!testFindOptimalBricks(x, y, width, height, color, expectedCost, expectedBricks)) {
        errCnt++;
    }

    // Composite
    testCnt++;
    width=5, height=1, x=0, y=0, expectedCost=14, expectedBricks=[new Brick(3, 1, 7, color, 0, 0),
        new Brick(2, 1, 7, color, 3, 0)];  // 2,3 would also work...
    if (!testFindOptimalBricks(x, y, width, height, color, expectedCost, expectedBricks)) {
        errCnt++;
    }

    // Long run
    testCnt++;
    width=12, height=1, x=0, y=0, expectedCost=27, expectedBricks=[new Brick(8, 1, 17, color, 0, 0),
        new Brick(4, 1, 10, color, 8, 0)]; // 4,8 would also work...
    if (!testFindOptimalBricks(x, y, width, height, color, expectedCost, expectedBricks)) {
        errCnt++;
    }

    // Long brick with pricing that encourages avoiding it in favor of smaller bricks
    testCnt++;
    let tmpBC = brickCost[4][1];    // Since it's a global we need to put it back the way we found it
    let tmpBCM = brickCostMap[4];   // Since it's a global we need to put it back the way we found it
    brickCost[4][1] = 16;
    delete brickCostMap[4];
    width=4, height=1, x=0, y=0, expectedCost=13, expectedBricks=[new Brick(3, 1, 7, color, 0, 0),
        new Brick(1, 1, 6, color, 3, 0)]; // 1,3 would also work...
    if (!testFindOptimalBricks(x, y, width, height, color, expectedCost, expectedBricks)) {
        errCnt++;
    }
    brickCost[4][1] = tmpBC;
    brickCostMap[4] = tmpBCM;

    // Composite at different x/y coordinates
    testCnt++;
    width=5, height=1, x=3, y=2, expectedCost=14, expectedBricks=[new Brick(3, 1, 7, color, 3, 2),
        new Brick(2, 1, 7, color, 6, 2)];  // 2,3 would also work...
    if (!testFindOptimalBricks(x, y, width, height, color, expectedCost, expectedBricks)) {
        errCnt++;
    }

    // Pair of composites of the same length, one at arbitrary non-origin x/y coordinates followed by 
    // one at the origin. Tests whether cached composite bricks start at the origin (if not, they
    // incorrectly offset the x/y coords when using the cache)
    testCnt++;
    width=7, height=1, x=3, y=2, expectedCost=17, expectedBricks=[new Brick(4, 1, 10, color, 3, 2),
        new Brick(3, 1, 7, color, 7, 2)];  // 2,3 would also work...
    // Delete cached values to prevent any previous tests from causing errors/false negatives
    delete brickCost[7];
    delete brickCostMap[7];    
    if (!testFindOptimalBricks(x, y, width, height, color, expectedCost, expectedBricks)) {
        errCnt++;
    } else {
        x=0, y=0, expectedBricks=[new Brick(4, 1, 10, color, 0, 0), new Brick(3, 1, 7, color, 4, 0)];
        if (!testFindOptimalBricks(x, y, width, height, color, expectedCost, expectedBricks)) {
            errCnt++;
        }
    }

    // 2x4
    testCnt++;
    width=2, height=4, expectedCost=14, x=0, y=0, expectedBricks = [new Brick(2, 4, 14, color, 0, 0)];  // 4x2 would also work...
    if (!testFindOptimalBricks(x, y, width, height, color, expectedCost, expectedBricks)) {
        errCnt++;
    }

    // 4x2, which doesn't have pre-populated pricing data
    testCnt++;
    width=4, height=2, expectedCost=14, x=0, y=0, expectedBricks = [new Brick(4, 2, 14, color, 0, 0)];  // 2x4 would also work...
    if (!testFindOptimalBricks(x, y, width, height, color, expectedCost, expectedBricks)) {
        errCnt++;
    }

    // 2x5
    testCnt++;
    width=2, height=5, expectedCost=21, x=0, y=0, expectedBricks = [new Brick(2, 4, 14, color, 0, 0),
        new Brick(2, 1, 7, color, 0, 4)];
    if (!testFindOptimalBricks(x, y, width, height, color, expectedCost, expectedBricks)) {
        errCnt++;
    }

    // 5x2
    testCnt++;
    width=5, height=2, expectedCost=21, x=0, y=0, expectedBricks = [new Brick(4, 2, 14, color, 0, 0),
        new Brick(1, 2, 7, color, 4, 0)];
    if (!testFindOptimalBricks(x, y, width, height, color, expectedCost, expectedBricks)) {
        errCnt++;
    }

    // 3x3
    testCnt++;
    width=3, height=3, expectedCost=21, x=0, y=0, expectedBricks = [new Brick(2, 3, 14, color, 0, 0),
        new Brick(1, 3, 7, color, 2, 0)];
    if (!testFindOptimalBricks(x, y, width, height, color, expectedCost, expectedBricks)) {
        errCnt++;
    }
    
    // 7x5
    /*
     * |oooo|oo|o|
     * |oooo|oo|o|
     * |oooo|oo|o|
     * |oooo|oo|o|
     * -----------
     * |oooo|oo o|
     */
    testCnt++;
    width=7, height=5, expectedCost=61, x=0, y=0, expectedBricks = [new Brick(4, 4, 20, color, 0, 0),
        new Brick(4, 1, 10, color, 0, 4), new Brick(2, 4, 14, color, 4, 0), new Brick(1, 4, 10, color, 6, 0), 
        new Brick(3, 1, 7, color, 4, 4) ];
    if (!testFindOptimalBricks(x, y, width, height, color, expectedCost, expectedBricks)) {
        errCnt++;
    }

    // 7x5 at a different x,y coordinate
    testCnt++;
    width=7, height=5, expectedCost=61, x=3, y=2, expectedBricks = [new Brick(4, 4, 20, color, 3, 2),
        new Brick(4, 1, 10, color, 3, 6), new Brick(2, 4, 14, color, 7, 2), new Brick(1, 4, 10, color, 9, 2), 
        new Brick(3, 1, 7, color, 7, 6) ];
    if (!testFindOptimalBricks(x, y, width, height, color, expectedCost, expectedBricks)) {
        errCnt++;
    }

    if (errCnt === 0) {
        console.log(`FindBricks: ${testCnt}/${testCnt} tests passed!`);
    } else {
        console.warn(`FindBricks tests failed (${testCnt - errCnt} passed, ${errCnt} failures)`);
    }
}

function testOneBOM(input, palette, expected) {
    let errCnt = 0;
    const output = generateBOM(input, palette);
    if (!output instanceof HTMLUListElement) {
        console.error(`Error: output not an HTML UL (got ${output})`);
        errCnt = 1;
    } else if (output.outerHTML != expected) {
        console.error(`Error: wrong BOM HTML: got: ${output.outerHTML},
            expected: ${expected}`);
        errCnt = 1;
    }
    return errCnt;
}

function testGenerateBOM() {
    let testCnt = 0;
    let errCnt = 0;
    let input, expected;
    const palette = new Palette3BitColor("testGenerateBOM"); // Chosen since it's simple
    // Palettes lazy-load colors, so force the palette to initialize itself
    palette.getPalette();

    input = [
        new Brick(3, 1, 7, TESTBOM_RED, 3, 2),
        new Brick(2, 1, 7, TESTBOM_RED, 6, 2),
        new Brick(8, 1, 17, TESTBOM_BLUE, 0, 0),
        new Brick(4, 1, 10, TESTBOM_BLUE, 8, 0)
    ];
    // Comparing HTML is not ideal, but far simpler than comparing DOM trees. Good enough for now.
    expected = "<div>"
    + "<div><span class=\"bomcolor-box\" style=\"--color: rgb(255, 0, 0)\"></span>"
    + "Red<ul><li>1 x 2: 1</li><li>1 x 3: 1</li></ul></div>"
    + "<div><span class=\"bomcolor-box\" style=\"--color: rgb(0, 0, 255)\"></span>"
    + "Blue<ul><li>1 x 4: 1</li><li>1 x 8: 1</li></ul></div>"
    + "</div>";
    ++testCnt;
    errCnt += testOneBOM(input, palette, expected);

    // Right triangle with right angle at the origin
    // ■ ■ ■ ■
    // ■ ■ ■ □
    // ■ ■ □ □
    // ■ □ □ □
    input = [
        new Brick(3, 2, 14, TESTBOM_RED, 0, 0),
        new Brick(1, 1, 6, TESTBOM_RED, 3, 0),
        new Brick(1, 3, 7, TESTBOM_BLUE, 3, 1),
        new Brick(2, 1, 7, TESTBOM_RED, 0, 2),
        new Brick(1, 2, 7, TESTBOM_BLUE, 2, 2),
        new Brick(1, 1, 6, TESTBOM_RED, 0, 3),
        new Brick(1, 1, 6, TESTBOM_BLUE, 1, 3),
    ];
    // Comparing HTML is not ideal, but far simpler than comparing DOM trees. Good enough for now.
    expected = "<div>"
    + "<div><span class=\"bomcolor-box\" style=\"--color: rgb(255, 0, 0)\"></span>"
    + "Red<ul><li>1 x 1: 2</li><li>1 x 2: 1</li><li>2 x 3: 1</li></ul></div>"
    + "<div><span class=\"bomcolor-box\" style=\"--color: rgb(0, 0, 255)\"></span>"
    + "Blue<ul><li>1 x 1: 1</li><li>1 x 2: 1</li><li>1 x 3: 1</li></ul></div>"
    + "</div>";    
    ++testCnt;
    errCnt += testOneBOM(input, palette, expected);

    if (errCnt === 0) {
        console.log(`generateBOM: ${testCnt}/${testCnt} tests passed!`);
    } else {
        console.warn(`generateBOM tests failed (${testCnt - errCnt} passed, ${errCnt} failures)`);
    }
}

testGenerateBOM();
testFindRectsSinglePixels();
testFindRectsSingleLine();
testFindRectsMultiLine();
testFindRectsExpanding();
testFindRectsLowCPSFirst();
testFindBricks();
