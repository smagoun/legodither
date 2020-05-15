
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

function testFindOptimalBricks(x, y, length, color, expectedCost, expectedBricks) {
    ret = true;
    let {cost, bricks} = findOptimalBricks(x, y, length, color);
    if (cost != expectedCost) {
        console.error(`Length ${length} cost: ${cost}, expected: ${expectedCost}`);
        ret = false;
    }
    if (!checkBricks(bricks, expectedBricks)) {
        console.error(`Length ${length} got bricks ${bricks}, expected: ${expectedBricks}`);
        ret = false;
    }
    return ret;
}

function testFindRects() {
    let errCnt = 0;
    let testCnt = 0;
    let expected = [];

    // Create image with test data
    let width = 4;
    let height = 4;
    let pixelStride = 4;    // RGBA
    let lineStride = width * pixelStride;
    let imageData = {};
    let red = [255, 0, 0, 255];
    let blue = [0, 0, 255, 255];
    imageData.data = new Array(width * height * pixelStride);
    let img = new ImageInfo(width, height, lineStride, pixelStride, imageData);
    
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

    let rects = findRects(img);
    for (let i = 0; i < rects.length; i++) {
        let a = rects[i];
        let b = expected[i];
        testCnt++
        if (a.x != b.x || a.y != b.y || a.width != b.width || a.height != b.height) {
            // Ignore color for now, color differences will manifest as different rectangles
            errCnt++
            console.error(`Test ${testCnt} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
        }
    }
    if (errCnt === 0) {
        console.log(`FindRects: ${testCnt}/${testCnt} tests passed!`);
    } else {
        console.warn(`FindRects: tests failed (${testCnt - errCnt} passed, ${errCnt} failures)`);
    }
}

function test1D() {
    let testCnt = 0;
    let errCnt = 0;

    let expectedCost;
    let expectedBricks = [];
    let length;
    let color = [0, 0, 0, 0];

    // Base case: 0x0
    testCnt++;
    // height=1 is a hack to get around hardcoded 1px height assumption of findOptimalBricks
    length=0, x=0, y=0, expectedCost=0, expectedBricks=[new Brick(0, 1, 0, color, 0, 0)];
    if (!testFindOptimalBricks(x, y, length, color, expectedCost, expectedBricks)) {
        errCnt++;
    }

    // 1x1
    testCnt++;
    length=1, x=0, y=0, expectedCost=6, expectedBricks=[new Brick(1, 1, 6, color, 0, 0)];
    if (!testFindOptimalBricks(x, y, length, color, expectedCost, expectedBricks)) {
        errCnt++;
    }

    // Longer brick
    testCnt++;
    length=4, x=0, y=0, expectedCost=10, expectedBricks=[new Brick(4, 1, 10, color, 0, 0)];
    if (!testFindOptimalBricks(x, y, length, color, expectedCost, expectedBricks)) {
        errCnt++;
    }

    // Composite
    testCnt++;
    length=5, x=0, y=0, expectedCost=14, expectedBricks=[new Brick(3, 1, 7, color, 0, 0),
        new Brick(2, 1, 7, color, 3, 0)];  // 2,3 would also work...
    if (!testFindOptimalBricks(x, y, length, color, expectedCost, expectedBricks)) {
        errCnt++;
    }

    // Long run
    testCnt++;
    length=12, x=0, y=0, expectedCost=27, expectedBricks=[new Brick(8, 1, 17, color, 0, 0),
        new Brick(4, 1, 10, color, 8, 0)]; // 4,8 would also work...
    if (!testFindOptimalBricks(x, y, length, color, expectedCost, expectedBricks)) {
        errCnt++;
    }

    // Long brick with pricing that encourages avoiding it in favor of smaller bricks
    testCnt++;
    let tmpBC = brickCost[4];     // Since it's a global we need to put it back the way we found it
    let tmpBCM = brickCostMap[4]; // Since it's a global we need to put it back the way we found it
    brickCost[4] = 16;
    delete brickCostMap[4];
    length=4, x=0, y=0, expectedCost=13, expectedBricks=[new Brick(3, 1, 7, color, 0, 0),
        new Brick(1, 1, 6, color, 3, 0)]; // 1,3 would also work...
    if (!testFindOptimalBricks(x, y, length, color, expectedCost, expectedBricks)) {
        errCnt++;
    }
    brickCost[4] = tmpBC;
    brickCostMap[4] = tmpBCM;

    // Composite
    testCnt++;
    length=5, x=3, y=2, expectedCost=14, expectedBricks=[new Brick(3, 1, 7, color, 3, 2),
        new Brick(2, 1, 7, color, 6, 2)];  // 2,3 would also work...
    if (!testFindOptimalBricks(x, y, length, color, expectedCost, expectedBricks)) {
        errCnt++;
    }

    if (errCnt === 0) {
        console.log(`1D-BOM: ${testCnt}/${testCnt} tests passed!`);
    } else {
        console.warn(`1D-BOM tests failed (${testCnt - errCnt} passed, ${errCnt} failures)`);
    }
}

testFindRects();
test1D();
