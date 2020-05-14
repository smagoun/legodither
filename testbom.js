
function sameBricks(a, b) {
    if (a.length === b.length) {
        for (let i = 0; i < a.length; i++) {
            if (a[i] != b[i]) {
                return false;
            }
        }
        return true;
    }
    return false;
}   

function testFindBestCostBricks(length, expectedCost, expectedBricks) {
    ret = true;
    let {cost, bricks} = findBestCostBricks(length);
    if (cost != expectedCost) {
        console.error(`Length ${length} cost: ${cost}, expected: ${expectedCost}`);
        ret = false;
    }
    if (!sameBricks(bricks, expectedBricks)) {
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

    // Base case: 0x0
    testCnt++;
    length = 0, expectedCost = 0, expectedBricks = [0];
    if (!testFindBestCostBricks(length, expectedCost, expectedBricks)) {
        errCnt++;
    }

    // 1x1
    testCnt++;
    length = 1, expectedCost = 6, expectedBricks = [1];
    if (!testFindBestCostBricks(length, expectedCost, expectedBricks)) {
        errCnt++;
    }

    // Longer brick
    testCnt++;
    length = 4, expectedCost = 10, expectedBricks = [4];
    if (!testFindBestCostBricks(length, expectedCost, expectedBricks)) {
        errCnt++;
    }

    // Composite
    testCnt++;
    length = 5, expectedCost = 14, expectedBricks = [3,2];  // 2,3 would also work...
    if (!testFindBestCostBricks(length, expectedCost, expectedBricks)) {
        errCnt++;
    }

    // Long run
    testCnt++;
    length = 12, expectedCost = 27, expectedBricks = [8,4];  // 2,3 would also work...
    if (!testFindBestCostBricks(length, expectedCost, expectedBricks)) {
        errCnt++;
    }

    // Long brick with pricing that encourages avoiding it in favor of smaller bricks
    testCnt++;
    let tmpBC = brickCost[4];     // Since it's a global we need to put it back the way we found it
    let tmpBCM = brickCostMap[4]; // Since it's a global we need to put it back the way we found it
    brickCost[4] = 16;
    delete brickCostMap[4];
    length = 4, expectedCost = 13, expectedBricks = [3,1];
    if (!testFindBestCostBricks(length, expectedCost, expectedBricks)) {
        errCnt++;
    }
    brickCost[4] = tmpBC;
    brickCostMap[4] = tmpBCM;

    if (errCnt === 0) {
        console.log("1D-BOM tests passed!");
    } else {
        console.warn(`1D-BOM tests failed (${errCnt} failures)`);
    }
}

test1D();
