
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
        console.log("1D-BOM tests passed!");
    } else {
        console.warn(`1D-BOM tests failed (${errCnt} failures)`);
    }
}

test1D();
