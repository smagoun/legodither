
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
    const {cost, bricks} = findOptimalBricks(x, y, width, height, color);
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
    let errCnt = 0;
    let testCnt = 0;
    const expected = [];

    // Create image with test data
    const width = 4;
    const height = 4;
    const pixelStride = 4;    // RGBA
    const lineStride = width * pixelStride;
    const imageData = {};
    const red = [255, 0, 0, 255];
    const blue = [0, 0, 255, 255];
    imageData.data = new Array(width * height * pixelStride);
    const img = new ImageInfo(width, height, lineStride, pixelStride, imageData);
    
    // Line that's all the same color
    for (let i = 0; i < width; i++) {   
        img.setPixel(i, 0, red);
        expected.push({x: i, y: 0, width: 1, height: 1, color: red})
    }

    // Line with multiple colors
    img.setPixel(0, 1, red);
    img.setPixel(1, 1, red);
    img.setPixel(2, 1, blue);
    img.setPixel(3, 1, blue);
    expected.push({x: 0, y: 1, width: 1, height: 1, color: red});
    expected.push({x: 1, y: 1, width: 1, height: 1, color: red});
    expected.push({x: 2, y: 1, width: 1, height: 1, color: blue});
    expected.push({x: 3, y: 1, width: 1, height: 1, color: blue});

    // Line whose last pixel is its own color
    img.setPixel(0, 2, red);
    img.setPixel(1, 2, red);
    img.setPixel(2, 2, red);
    img.setPixel(3, 2, blue);
    expected.push({x: 0, y: 2, width: 1, height: 1, color: red});
    expected.push({x: 1, y: 2, width: 1, height: 1, color: red});
    expected.push({x: 2, y: 2, width: 1, height: 1, color: red});
    expected.push({x: 3, y: 2, width: 1, height: 1, color: blue});

    // Alternating colors
    img.setPixel(0, 3, red);
    img.setPixel(1, 3, blue);
    img.setPixel(2, 3, red);
    img.setPixel(3, 3, blue);
    expected.push({x: 0, y: 3, width: 1, height: 1, color: red});
    expected.push({x: 1, y: 3, width: 1, height: 1, color: blue});
    expected.push({x: 2, y: 3, width: 1, height: 1, color: red});
    expected.push({x: 3, y: 3, width: 1, height: 1, color: blue});

    const rects = findRectsSinglePixels(img);
    for (let i = 0; i < rects.length; i++) {
        const a = rects[i];
        const b = expected[i];
        testCnt++
        if (a.x != b.x || a.y != b.y || a.width != b.width || a.height != b.height) {
            // Ignore color for now, color differences will manifest as different rectangles
            errCnt++;
            console.error(`Test ${testCnt} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
        }
    }
    if (errCnt === 0) {
        console.log(`FindRectsSinglePixels: ${testCnt}/${testCnt} tests passed!`);
    } else {
        console.warn(`FindRectsSinglePixels: tests failed (${testCnt - errCnt} passed, ${errCnt} failures)`);
    }
}

function testFindRectsSingleLine() {
    let errCnt = 0;
    let testCnt = 0;
    const expected = [];

    // Create image with test data
    const width = 4;
    const height = 4;
    const pixelStride = 4;    // RGBA
    const lineStride = width * pixelStride;
    const imageData = {};
    const red = [255, 0, 0, 255];
    const blue = [0, 0, 255, 255];
    imageData.data = new Array(width * height * pixelStride);
    const img = new ImageInfo(width, height, lineStride, pixelStride, imageData);
    
    // Line that's all the same color
    for (let i = 0; i < width; i++) {   
        img.setPixel(i, 0, red);
    }
    expected.push({x: 0, y: 0, width: width, height: 1, color: red});

    // Line with multiple colors
    img.setPixel(0, 1, red);
    img.setPixel(1, 1, red);
    img.setPixel(2, 1, blue);
    img.setPixel(3, 1, blue);
    expected.push({x: 0, y: 1, width: 2, height: 1, color: red});
    expected.push({x: 2, y: 1, width: 2, height: 1, color: blue});

    // Line whose last pixel is its own color
    img.setPixel(0, 2, red);
    img.setPixel(1, 2, red);
    img.setPixel(2, 2, red);
    img.setPixel(3, 2, blue);
    expected.push({x: 0, y: 2, width: 3, height: 1, color: red});
    expected.push({x: 3, y: 2, width: 1, height: 1, color: blue});

    // Alternating colors
    img.setPixel(0, 3, red);
    img.setPixel(1, 3, blue);
    img.setPixel(2, 3, red);
    img.setPixel(3, 3, blue);
    expected.push({x: 0, y: 3, width: 1, height: 1, color: red});
    expected.push({x: 1, y: 3, width: 1, height: 1, color: blue});
    expected.push({x: 2, y: 3, width: 1, height: 1, color: red});
    expected.push({x: 3, y: 3, width: 1, height: 1, color: blue});

    const rects = findRectsSingleLine(img);
    for (let i = 0; i < rects.length; i++) {
        const a = rects[i];
        const b = expected[i];
        testCnt++
        if (a.x != b.x || a.y != b.y || a.width != b.width || a.height != b.height) {
            // Ignore color for now, color differences will manifest as different rectangles
            errCnt++;
            console.error(`Test ${testCnt} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
        }
    }
    if (errCnt === 0) {
        console.log(`FindRectsSingleLine: ${testCnt}/${testCnt} tests passed!`);
    } else {
        console.warn(`FindRectsSingleLine: tests failed (${testCnt - errCnt} passed, ${errCnt} failures)`);
    }
}

function testOneImg(img, fn, expected, testCnt) {
    let rects = fn(img);
    let errCnt = 0;
    if (rects.length === expected.length) {
        for (let i = 0; i < rects.length; i++) {
            const a = rects[i];
            const b = expected[i];
            if (a.x != b.x || a.y != b.y || a.width != b.width || a.height != b.height) {
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
        console.error(`Test ${testCnt} expected ${JSON.stringify(expected)}, 
            got ${JSON.stringify(rects)}`);
    }
    if (errCnt > 0) {
        console.error(`Test ${testCnt} expected ${JSON.stringify(expected)}, 
            got ${JSON.stringify(rects)}`);
    }
    return errCnt;
}

function testFindRectsExpanding() {
    let errCnt = 0;
    let testCnt = 0;
    let expected;

    // Create image with test data
    const width = 4;
    const height = 4;
    const pixelStride = 4;    // RGBA
    const lineStride = width * pixelStride;
    const imageData = {};
    const red = [255, 0, 0, 255];
    const blue = [0, 0, 255, 255];
    imageData.data = new Array(width * height * pixelStride);
    const img = new ImageInfo(width, height, lineStride, pixelStride, imageData);
    
    // 4x4 grid of one color
    expected = [];
    for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
            img.setPixel(i, j, red);
        }
    }
    expected.push({x: 0, y: 0, width: 4, height: 4, color: red});
    errCnt += testOneImg(img, findRectsExpanding, expected, ++testCnt);

    // 4x2 on top, 4x2 on bottom
    expected = [];
    for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
            img.setPixel(i, j, (j>1) ? blue: red);
        }
    }
    expected.push({x: 0, y: 0, width: 4, height: 2, color: red});
    expected.push({x: 0, y: 2, width: 4, height: 2, color: blue});
    errCnt += testOneImg(img, findRectsExpanding, expected, ++testCnt);

    // Right triangle with corner at top left
    expected = [];
    for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
            img.setPixel(i, j, ((width-j-i) > 0) ? red : blue);
        }
    }
    expected.push({x: 0, y: 0, width: 3, height: 2, color: red});
    expected.push({x: 3, y: 0, width: 1, height: 1, color: red});
    expected.push({x: 3, y: 1, width: 1, height: 3, color: blue});
    expected.push({x: 0, y: 2, width: 2, height: 1, color: red});
    expected.push({x: 2, y: 2, width: 1, height: 2, color: blue});
    expected.push({x: 0, y: 3, width: 1, height: 1, color: red});
    expected.push({x: 1, y: 3, width: 1, height: 1, color: blue});
    errCnt += testOneImg(img, findRectsExpanding, expected, ++testCnt);

    // Right triangle with corner at top right
    expected = [];
    for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
            img.setPixel(i, j, (j > i) ? red : blue);
        }
    }
    expected.push({x: 0, y: 0, width: 4, height: 1, color: blue});
    expected.push({x: 0, y: 1, width: 1, height: 3, color: red});
    expected.push({x: 1, y: 1, width: 3, height: 1, color: blue});
    expected.push({x: 1, y: 2, width: 1, height: 2, color: red});
    expected.push({x: 2, y: 2, width: 2, height: 1, color: blue});
    expected.push({x: 2, y: 3, width: 1, height: 1, color: red});
    expected.push({x: 3, y: 3, width: 1, height: 1, color: blue});
    errCnt += testOneImg(img, findRectsExpanding, expected, ++testCnt);


    // Line that's all the same color
    expected = [];
    for (let j = 0; j < height; j++) {
        let color = (j === 0) ? red : blue;
        for (let i = 0; i < width; i++) {
            img.setPixel(i, j, color);
       }
    }
    expected.push({x: 0, y: 0, width: 4, height: 1, color: red});
    expected.push({x: 0, y: 1, width: 4, height: 3, color: blue});
    errCnt += testOneImg(img, findRectsExpanding, expected, ++testCnt);

    // DCT-ish image
    expected = [];
    // Top left cube
    img.setPixel(0, 0, red);
    img.setPixel(1, 0, red);
    img.setPixel(0, 1, red);
    img.setPixel(1, 1, red);
    // Top right cube
    img.setPixel(2, 0, blue);
    img.setPixel(3, 0, red);
    img.setPixel(2, 1, blue);
    img.setPixel(3, 1, red);
    // Bottom left cube
    img.setPixel(0, 2, blue);
    img.setPixel(1, 2, blue);
    img.setPixel(0, 3, red);
    img.setPixel(1, 3, red);
    // Bottom right cube
    img.setPixel(2, 2, red);
    img.setPixel(3, 2, blue);
    img.setPixel(2, 3, blue);
    img.setPixel(3, 3, red);

    // First 2 rows
    expected.push({x: 0, y: 0, width: 2, height: 2, color: red});
    expected.push({x: 2, y: 0, width: 1, height: 2, color: blue});
    expected.push({x: 3, y: 0, width: 1, height: 2, color: red});
    // 3rd row
    expected.push({x: 0, y: 2, width: 2, height: 1, color: blue});
    expected.push({x: 2, y: 2, width: 1, height: 1, color: red});
    expected.push({x: 3, y: 2, width: 1, height: 1, color: blue});
    // Last row
    expected.push({x: 0, y: 3, width: 2, height: 1, color: red});
    expected.push({x: 2, y: 3, width: 1, height: 1, color: blue});
    expected.push({x: 3, y: 3, width: 1, height: 1, color: red});
    errCnt += testOneImg(img, findRectsExpanding, expected, ++testCnt);


    if (errCnt === 0) {
        console.log(`FindRectsExpanding: ${testCnt}/${testCnt} tests passed!`);
    } else {
        console.warn(`FindRectsExpanding: tests failed (${testCnt - errCnt} passed, ${errCnt} failures)`);
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
    const red = [255, 0, 0, 255];
    const blue = [0, 0, 255, 255];
    let input, expected;
    const palette = new Palette3BitColor("testGenerateBOM"); // Chosen since it's simple
    // Palettes lazy-load colors, so force the palette to initialize itself
    palette.getPalette();

    input = [
        new Brick(3, 1, 7, red, 3, 2),
        new Brick(2, 1, 7, red, 6, 2),
        new Brick(8, 1, 17, blue, 0, 0),
        new Brick(4, 1, 10, blue, 8, 0)
    ];
    // Comparing HTML is not ideal, but far simpler than comparing DOM trees. Good enough for now.
    expected = "<ul><li>Red<ul><li>1 x 2: 1</li><li>1 x 3: 1</li></ul></li><li>Blue<ul><li>1 x 4: 1</li><li>1 x 8: 1</li></ul></li></ul>";
    ++testCnt;
    errCnt += testOneBOM(input, palette, expected);

    // Right triangle with right angle at the origin
    input = [
        new Brick(3, 2, 14, red, 0, 0),
        new Brick(1, 1, 6, red, 3, 0),
        new Brick(1, 3, 7, blue, 3, 1),
        new Brick(2, 1, 7, red, 0, 2),
        new Brick(1, 2, 7, blue, 2, 2),
        new Brick(1, 1, 6, red, 0, 3),
        new Brick(1, 1, 6, blue, 1, 3),
    ];
    // Comparing HTML is not ideal, but far simpler than comparing DOM trees. Good enough for now.
    expected = "<ul><li>Red<ul><li>1 x 1: 2</li><li>1 x 2: 1</li><li>2 x 3: 1</li></ul></li>"
        + "<li>Blue<ul><li>1 x 1: 1</li><li>1 x 2: 1</li><li>1 x 3: 1</li></ul></li></ul>";
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
testFindRectsExpanding();
testFindBricks();
