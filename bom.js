/**
 * Minimum cost to implement each run of bricks. Index is the length of the brick,
 * so brickCost[4] is the cost (in cents) of a 1x4.
 * 
 * Values are in cents, to avoid floating-point errors when adding values.
 * 
 * Prices from US Pick-A-Brick, May 2020
 */
let brickCost = [
    0,
    06,
    07,
    07,
    10,
];
brickCost[6] = 14;
brickCost[8] = 17;

/**
 * Cache of brick length to cost mappings, used by findBestCostBricks();
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
    document.getElementById("brickList").firstChild.replaceWith(bomList);
}

/**
 * Wrapper for findBestCostBricks that applies color and location (x/y) information.
 * 
 * Returns a tuple of total cost for bricks, and list of Bricks populated with color/price/location
 * information.
 * 
 * @param {*} x 
 * @param {*} y 
 * @param {*} brickLength 
 * @param {*} color 
 */
function findOptimalBricks(x, y, brickLength, color) {
    const {cost, bricks} = findBestCostBricks(brickLength);
    // console.log("Best cost for " + brickLength + " is " + cost + " with bricks " + bricks);
    const ret = [];
    for (const brickSize of bricks) {
        // Could also use brickCostMap; shouldn't matter (even in the case of (2) 1x2s that are cheaper
        // than a 1x4, since findBestCostBricks() should have given us the 1x2s to look up)
        // TODO: Don't hardcode height=1
        ret.push(new Brick(brickSize, 1, brickCost[brickSize], color, x, y));
        x += brickSize;
    }
    return {
        cost: cost,
        bricks: ret,
    };
}

/**
 * Return the lowest cost to implement a run of studs, and the set of bricks needed. For example
 * a run of 5 studs can be implemented as (1x4 + 1x1) or (1x2 + 1x3); one option might
 * be priced lower than the other. Prices may be such that some brick sizes are never picked. 
 * For example if (2) 1x2 bricks is cheaper than a 1x4, this will always pick (2) 1x2 bricks
 * for a 4-stud run. Does not support bricks wider than 1 stud (e.g. 2x4.
 * 
 * Caches calculations in brickCost array for future use.
 * 
 * Returns an Object of {cost, [brickSize, brickSize, ...]}
 * 
 * @param {*} length 
 */
function findBestCostBricks(length) {
    let ret = brickCostMap[length];
    if (ret === undefined) {
        let minCost = Infinity;
        let minCostBricks = [];
        const c = brickCost[length];     // Base case: look for a LEGO part for which we have data
        if (c != undefined) {
            minCost = c;
            minCostBricks = [length];
        }
        for (let i = 1; i <= Math.floor(length / 2); i++) {
            const a = findBestCostBricks(length - i);
            const b = findBestCostBricks(i);
            if ((a.cost + b.cost) < minCost) {
                minCost = a.cost + b.cost;
                minCostBricks = [...a.bricks, ...b.bricks];
            }
        }
        ret = {cost: minCost, bricks: minCostBricks};
        brickCostMap[length] = ret;
    } 
    return ret;
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
                const {cost, bricks} = findOptimalBricks(brickStart, y, brickLength, currColor);
                bom.push(...bricks);
                totalCost += cost;
                // console.log("New color end-of-run, placing brick (start, length, color): " + bricks);
                brickStart = x;
                brickLength = 0;
                currColor = [...nextColor];
            }
            brickLength++;      // Consume the pixel
        }
        if (brickStart != -1) {
            const {cost, bricks} = findOptimalBricks(brickStart, y, brickLength, currColor);
            bom.push(...bricks);
            totalCost += cost;
            // console.log("Found end of line, placing brick (start, length, color): " + bricks);
        }
    }
    // console.log("Total cost of image: " + totalCost + " for " + bom.length + " bricks");
    return {
        cost: totalCost,
        bom: bom,
    }
}
