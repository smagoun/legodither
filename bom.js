/**
 * 2-D array that holds prices of bricks:
 * 
 * brickCost[width][height] = cost of the brick in cents.
 * 
 * For example  brickCost[2][4] is the cost (in cents) of a 2x4 brick. Only 
 * initialized  with sizes up to 4x6, since larger sizes have very limited color 
 * options on Pick-A-Brick. Revisit this if expanding to bricklink, brickowl, etc.
 * 
 * Values are in cents, to avoid floating-point errors when adding values.
 * 
 * Prices from US Pick-A-Brick, May 2020
 */
let brickCost = [];
brickCost[0] = [];
brickCost[1] = [];
brickCost[2] = [];
brickCost[4] = [];

// base case
brickCost[0][0] = 0;
// 1-wide
brickCost[1][1] = 06;
brickCost[1][2] = 07;
brickCost[1][3] = 07;
brickCost[1][4] = 10;
brickCost[1][6] = 14;
brickCost[1][8] = 17;
// 2-wide
brickCost[2][2] = 10;
brickCost[2][3] = 14;
brickCost[2][4] = 14;
brickCost[2][6] = 18;
brickCost[2][8] = 24;
// 4-wide
brickCost[4][4] = 20;
brickCost[4][6] = 41;

/**
 * Cache of brick size to cost+implementation mappings, used by findBestCostBricks(): 
 * brickCostMap[width][height] = {cost, list of bricks}
 * 
 * Each brick in the list of bricks has its x,y coordinates set relative
 * to the origin.
 */
const brickCostMap = [];

/**
 * Render the Bill of Materials on the page
 * 
 * @param {Number} cost Total cost of the BOM in cents 
 * @param {Array} bom Array of Bricks
 * @param {*} palette 
 */
function renderBOM(cost, bom, palette) {
    document.getElementById("bomTotalCost").textContent = "$" + (cost / 100).toFixed(2);
    document.getElementById("bomTotalBrickCount").textContent = bom.length;
    let bomList = generateBOM(bom, palette);
    document.getElementById("brickList").firstChild.replaceWith(bomList);
}


/**
 * Generate the Bill of Materials. Groups the bricks by color, then for each color generates
 * a list of bricks.
 * 
 * Returns an element to be placed in the DOM.
 * 
 * @param {*} bom Array of Bricks
 * @param {*} palette 
 */
function generateBOM(bom, palette) {
    bomSimplified = {};     // 2-level associative array of Bricks grouped by color then size
    // Group the bricks by color then size
    for (brick of bom) {
        const color = palette.getColorName(brick.color);
        const width = brick.width;
        if (bomSimplified[color] === undefined) {
            bomSimplified[color] = {}
        }
        if (bomSimplified[color][width] === undefined) {
            bomSimplified[color][width] = 1;
        } else {
            bomSimplified[color][width] += 1;
        }
    }
    // Render the brick list
    let bomList = document.createElement("ul");
    for (const [bomColor, bomSizes] of Object.entries(bomSimplified)) {
        let elt = document.createElement("li");
        let colorName = bomColor;
        if (palette != null) {
            colorName = palette.getColorName(bomColor);
        }
        elt.textContent = colorName;
        let ul = document.createElement("ul");
        for (bomSize in bomSizes) {
            let li = document.createElement("li");
            li.textContent = "1 x " + bomSize + ": " + bomSimplified[bomColor][bomSize];
            ul.appendChild(li);
        }
        elt.appendChild(ul);
        bomList.appendChild(elt);
    }
    return bomList;
}

/**
 * Wrapper for findBestCostBricks that applies color information to the bricks.
 * 
 * Returns a tuple of total cost for bricks, and list of Bricks populated with color/price/location
 * information.
 * 
 * @param {*} x 
 * @param {*} y 
 * @param {*} width
 * @param {*} height 
 * @param {*} color 
 */
function findOptimalBricks(x, y, width, height, color) {
    const {cost, bricks} = findBestCostBricks(width, height, color, x, y);
    // console.log(`Best cost for ${width}x${height} is ${cost} with bricks ${bricks}`);
    for (const brick of bricks) {
        brick.color = color;
    }
    return {
        cost: cost,
        bricks: bricks,
    };
}

/**
 * Return the lowest cost to implement a run of studs, and the set of bricks needed. For example
 * a run of 5 studs can be implemented as (1x4 + 1x1) or (1x2 + 1x3); one option might
 * be priced lower than the other. Prices may be such that some brick sizes are never picked. 
 * For example if (2) 1x2 bricks is cheaper than a 1x4, this will always pick (2) 1x2 bricks
 * for a 4-stud run. Does not support bricks wider than 1 stud (e.g. 2x4.
 * 
 * Caches calculations in brickCost array for future use, and can rotate bricks 90 degrees to find
 * the best orientation.
 * 
 * Works by recursively partitioning the rectangle horizontally and vertically, and checking
 * which of the partitions yields the lowest cost.
 * 
 * Returns an Object of {cost, [Brick, Brick, ...]}
 * 
 * Each Brick in the output has its x/y coordinates set relative to the x/y passed in to the 
 * function, allowing the layout engine to know where to put them. For example an 8x8 matrix
 * starting at 0,0 might have (4) 4x4 bricks in it, at (0,0), (4,0), (0,4), and (4,4).
 * 
 * TODO: rework this to take a generic fitness function (min. number of bricks is the other
 * option that comes to mind)
 * 
 * @param {*} width 
 * @param {*} height 
 * @param {*} color
 * @param {*} x Top-left X coordinate of the rectangle
 * @param {*} y Top-left Y coordinate of the rectancle
 */
function findBestCostBricks(width, height, color, x, y) {
    let ret;    // 2D array of [cost, [list of Bricks]]
    if (brickCostMap[width] === undefined) {
        brickCostMap[width] = [];
    }
    if (brickCost[width] === undefined) {
        brickCost[width] = [];
    }
    if (brickCost[height] === undefined) {
        brickCost[height] = [];
    }
    cached = brickCostMap[width][height];
    if (cached === undefined) {
        let minCost = Infinity;
        let minCostBricks = [];
        let c = brickCost[width][height];     // Base case: look for a LEGO part for which we have data
        if (c != undefined) {
            minCost = c;
            minCostBricks = [new Brick(width, height, minCost, color, x, y)];
        } else if (width != height) {
            // Try the other orientation unless it's a square
            c = brickCost[height][width];
            if (c != undefined) {
                minCost = c;
                minCostBricks = [new Brick(width, height, minCost, color, x, y)];
            }
        }
        // Try partitioning in each dimension; pick the least-expensive partition
        for (let i = 1; i <= Math.floor(width / 2); i++) {
            const a = findBestCostBricks(width - i, height, color, x, y);
            const b = findBestCostBricks(i, height, color, x + (width - i), y);
            if ((a.cost + b.cost) < minCost) {
                minCost = a.cost + b.cost;
                minCostBricks = [...a.bricks, ...b.bricks];
            }
        }
        for (let i = 1; i <= Math.floor(height / 2); i++) {
            const a = findBestCostBricks(width, height - i, color, x, y);
            const b = findBestCostBricks(width, i, color, x, y + (height - i));
            if ((a.cost + b.cost) < minCost) {
                minCost = a.cost + b.cost;
                minCostBricks = [...a.bricks, ...b.bricks];
            }
        }
        ret = {cost: minCost, bricks: minCostBricks};
        brickCostMap[width][height] = ret;
    } else {
        // Return a copy rather than the cached brick so we can set x/y coords
        ret = {};
        ret.cost = cached.cost;
        ret.bricks = [];
        for (brick of cached.bricks) {
            let retbrick = new Brick(brick.width, brick.height, brick.price, brick.color, brick.x + x, brick.y + y);
            ret.bricks.push(retbrick);
        }
    } 
    return ret;
}

/**
 * Return the set of rectangles of the same color in each line. These represent
 * runs of studs, and potentitally multi-stud bricks.
 * 
 * Does not support bricks that span multiple lines, either due to 
 * orientation or brick size (such as 2x4 bricks).
 * 
 * Returns an array of rectangles: {x, y, width, height, color}
 * 
 * @param {ImageInfo} img
 */
function findRectsSingleLine(img) {
    let rects = [];   // List of rectangles: width/height + x/y coords
    let nextColor = [0, 0, 0, 0];
    let currColor = [0, 0, 0, 0];
    for (y = 0; y < img.height; y++) {
        let brickStart = -1;    // -1 means there is no current brick
        let brickLength = 0;
        for (x = 0; x < img.width; x++) {
            img.getPixel(x, y, nextColor);
            if (brickStart === -1) {    // Check whether we should start a new brick
                brickStart = x;
                brickLength = 0;
                currColor = [...nextColor];
            } else if (!Color.sameColor(currColor, nextColor)) {
                rects.push({x: brickStart, y: y, width: brickLength, height: 1, color: currColor});
                // console.log("New color end-of-run, placing brick (start, length, color): " + bricks);
                brickStart = x;
                brickLength = 0;
                currColor = [...nextColor];
            }
            brickLength++;      // Consume the pixel
        }
        if (brickStart != -1) {
            rects.push({x: brickStart, y: y, width: brickLength, height: 1, color: currColor});
            // console.log("Found end of line, placing brick (start, length, color): " + bricks);
        }
    }
    return rects;
}

/**
 * Calculate the bill of materials for an image by calculating the set of bricks to use
 * on each line. Does not support bricks that span multiple lines, either due to orientation
 * or brick size (such as 2x4 bricks).
 * 
 * Returns a tuple of cost and an array of Bricks
 * 
 * @param {*} img
 */
function calculateBOMSingleLines(img) {
    let bom = [];   // Brick objects: size, price, color, x/y coords of top left
    let totalCost = 0;
    let rects = findRectsSingleLine(img);
    for (rect of rects) {
        // For each rectangle, find the minimum set of bricks required to implement it
        const {cost, bricks} = findOptimalBricks(rect.x, rect.y, rect.width, rect.height, rect.color);
        bom.push(...bricks);
        totalCost += cost;
    }
    return {
        cost: totalCost,
        bom: bom,
    }
}
