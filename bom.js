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
 * Represents a rectangle. Very similar to Brick; could be merged someday
 */
class Rect {
    /**
     * Create a new Rect
     * 
     * @param {number} x x coordinate of the corner closest to the origin
     * @param {number} y y coordinate of the corner closest to the origin
     * @param {number} width Width of the rectangle in pixels
     * @param {number} height Height of the rectangle in pixels
     * @param {Array} color RGBA color information 
     */
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    /**
     * Return a shallow copy of the given Rect
     * 
     * @param {Rect} rect 
     */
    static copyRect(rect) {
        if (rect instanceof Rect) {
            return new Rect(rect.x, rect.y, rect.width, rect.height, rect.color);
        } else {
            return undefined;
        }
    }
}

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
    // Group the bricks by color then size
    // bomSimplified structure: [id][Color, [height][width]], where 'id' is "r,g,b,a"
    // (ID can be anything, just needs to be unique per-color. Would be nice to
    // use a Color as the key, but JS doesn't like that)
    bomSimplified = {};
    if (palette == undefined) {
        return ("");
    }
    for (brick of bom) {
        const color = new Color(brick.color, palette.getColorName(brick.color));
        let width = brick.width;
        let height = brick.height;
        if (height > width) {
            // Normalize the orientation of bricks
            const tmp = width;
            width = height;
            height = tmp;
        }
        const id = color.getRGBA();
        if (bomSimplified[id] === undefined) {
            bomSimplified[id] = [color, []];
        }
        if (bomSimplified[id][1][height] === undefined) {
            bomSimplified[id][1][height] = [];
        }
        if (bomSimplified[id][1][height][width] === undefined) {
            bomSimplified[id][1][height][width] = 1;
        } else {
            bomSimplified[id][1][height][width] += 1;
        }
    }
    // Render the brick list
    let bomList = document.createElement("div");
    bomList.setAttribute("class", "col");
    for (let [bomColor, bomHeights] of Object.entries(bomSimplified)) {
        let elt = document.createElement("div");
        let colorBox = document.createElement("span");
        colorBox.setAttribute("class", "bomcolor-box");
        let rgba = bomHeights[0].getRGBA();
        colorBox.setAttribute("style", "--color: rgb(" + rgba[0] + ", "
            + rgba[1] + ", " + rgba[2] + ")");
        let colorName = bomHeights[0].getName();
        elt.textContent = colorName;
        let ul = document.createElement("ul");
        bomHeights[1].forEach(function (widths, height) { 
            widths.forEach(function (numBricks, width) {
                let li = document.createElement("li");
                li.textContent = `${height} x ${width}: ${numBricks}`;
                ul.appendChild(li);
            });
        });
        elt.prepend(colorBox);
        elt.appendChild(ul);
        bomList.appendChild(elt);
    }
    return bomList;
}

/**
 * Wrapper for findBestCostBricks that applies color and location (x/y) information to the bricks.
 * 
 * Returns a tuple of total cost for bricks, and list of Bricks populated with color/price/location
 * information.
 * 
 * @param {Rect} rect
 */
function findOptimalBricks(rect) {
    const {cost, bricks} = findBestCostBricks(rect.width, rect.height, rect.color, 0, 0);
    // console.log(`Best cost for ${rect.width}x${rect.height} is ${cost} with bricks ${bricks}`);
    for (const brick of bricks) {
        brick.color = rect.color;
        brick.x += rect.x;
        brick.y += rect.y;
    }
    return {
        cost: cost,
        bricks: bricks,
    };
}

/**
 * Return the lowest cost to implement a rectangle of studs, and the set of bricks needed. For 
 * example a run of 5 studs can be implemented as (1x4 + 1x1) or (1x2 + 1x3); one option might
 * be priced lower than the other. Prices may be such that some brick sizes are never picked. 
 * For example if (2) 1x2 bricks is cheaper than a 1x4, this will always pick (2) 1x2 bricks
 * for a 4-stud run.
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
 * @param {Array} color RGBA color information
 * @param {*} x Top-left X coordinate of the rectangle
 * @param {*} y Top-left Y coordinate of the rectancle
 */
function findBestCostBricks(width, height, color, x, y) {
    if (brickCostMap[width] === undefined) {
        brickCostMap[width] = [];
    }
    if (brickCost[width] === undefined) {
        brickCost[width] = [];
    }
    if (brickCost[height] === undefined) {
        brickCost[height] = [];
    }
    let cached = brickCostMap[width][height];   // {cost, [list of Bricks]}
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
        cached = {cost: minCost, bricks: minCostBricks};
        brickCostMap[width][height] = cached;
    }
    // Return a copy rather than the cached brick so we can set x/y coords
    let ret = {};
    ret.cost = cached.cost;
    ret.bricks = [];
    for (brick of cached.bricks) {
        let retbrick = new Brick(brick.width, brick.height, brick.price, brick.color, brick.x + x, brick.y + y);
        ret.bricks.push(retbrick);
    }
    return ret;
}

/**
 * Return the set of rectangles of the same color in each line. For this
 * algorithm, these are just individual pixels
 * 
 * Returns an array of Rects
 * 
 * @param {ImageInfo} img
 */
function findRectsSinglePixels(img) {
    let rects = [];   // List of Rects
    for (y = 0; y < img.height; y++) {
        for (x = 0; x < img.width; x++) {
            let color = [0, 0, 0, 0];
            img.getPixel(x, y, color);
            rects.push(new Rect(x, y, 1, 1, color));
        }
    }
    return rects;
}

/**
 * Return the set of rectangles of the same color in each line. These represent
 * runs of studs, and potentitally multi-stud bricks.
 * 
 * Does not support bricks that span multiple lines, either due to 
 * orientation or brick size (such as 2x4 bricks).
 * 
 * Returns an array of Rects
 * 
 * @param {ImageInfo} img
 */
function findRectsSingleLine(img) {
    let rects = [];   // List of Rects
    let nextColor = [0, 0, 0, 0];
    let currColor = [0, 0, 0, 0];
    for (let y = 0; y < img.height; y++) {
        let brickStart = -1;    // -1 means there is no current brick
        let brickLength = 0;
        for (let x = 0; x < img.width; x++) {
            img.getPixel(x, y, nextColor);
            if (brickStart === -1) {    // Check whether we should start a new brick
                brickStart = x;
                brickLength = 0;
                currColor = [...nextColor];
            } else if (!Color.sameColor(currColor, nextColor)) {
                rects.push(new Rect(brickStart, y, brickLength, 1, currColor));
                // console.log("New color end-of-run, placing brick (start, length, color): " + bricks);
                brickStart = x;
                brickLength = 0;
                currColor = [...nextColor];
            }
            brickLength++;      // Consume the pixel
        }
        if (brickStart != -1) {
            rects.push(new Rect(brickStart, y, brickLength, 1, currColor));
            // console.log("Found end of line, placing brick (start, length, color): " + bricks);
        }
    }
    return rects;
}

/**
 * Return a set of rectangles of the same color, potentially spanning multiple lines.
 * Calls findRectsSingleLine(), then coalesces rectangles in adjacent rows with the 
 * same x coordinate, width, and color.
 * 
 * Returns an array of Rects
 * 
 * @param {ImageInfo} img
 */
function findRectsMultiLine(img) {
    let rects = findRectsSingleLine(img);
    let ret = [];
    // Sort by x
    rects.sort((a, b) => (a.x - b.x));
    let newRect = null;
    for (let i = 0; i < rects.length; i++) {
        let rect = rects[i];
        if (newRect == null) {
            // First row of img
            newRect = Rect.copyRect(rect);
        } else if (newRect != null 
                && rect.x === newRect.x
                && rect.width === newRect.width
                && rect.y === newRect.y + newRect.height
                && Color.sameColor(rect.color, newRect.color)) {
            // same color + same width: add them
            newRect.height++
        } else {
            // Start a new rect
            ret.push(newRect);
            newRect = Rect.copyRect(rect);
        }
    }
    ret.push(newRect);
    return ret;
}

/**
 * Find the rectangles of the same color.
 * 
 * Greedy algorithm that looks for horizontal + vertical runs of a color.
 * Starts at the top left and works toward the bottom-right; not great for shapes 
 * like a right triangle with right angle at the top right.
 * 
 * In this example, the algorithm will find a square inside the base of the
 * triangle on the left, while on the right it will find a series of horizontal
 * rectangles:
 * 
 * _______         _______
 * |  |_/           \____|
 * |__|/      vs     \___|
 * | |/               \__|
 * |_/                 \_|
 * |/                   \|
 * 
 * Returns an array of Rects
 * 
 * @param {*} img 
 */
function findRectsExpanding(img) {
    let rects = [];   // List of Rects

    // Keeps track of which pixels have been assigned to a rect. Convert to a bitfield to save memory
    let mapped = new Array(img.width * img.height).fill(0);
    let tmpColor = [0, 0, 0, 0];
    // Invariant: we've already mapped all the pixels in rows 0 to (y-1), and we've
    // mapped all the pixels in the current row from 0 to (x-1)
    for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
            // Find the first unmapped pixel
            let xy = (y * img.width) + x;
            let pixel = mapped[xy];
            if (pixel != 0) {
                // Pixel is already mapped
                continue;
            } else {
                // Pixel isn't mapped. Find the largest rectangle we can starting from here
                // Algorithm:
                // Try to expand by one px in the horizontal, then one px in vertical
                // Check the entire row/col in the direction we're expanding
                // If we find a non-matching pixel, stop expanding in that direction
                // Keep expanding in the other direction until we can't
                let currColor = [0, 0, 0, 0];
                img.getPixel(x, y, currColor);
                let expandX = true;
                let expandY = true;
                let rightEdge = x;
                let bottomEdge = y;

                // Mark the current pixel as being part of a rect
                mapped[xy]++;

                while (expandY || expandX) {
                    if (expandX) { 
                        if ((rightEdge+1) < img.width) {
                            // Try to expand one pixel to the right
                            let obstructions = false;
                            for (let yyy = y; yyy <= bottomEdge && yyy < img.height; yyy++) {
                                // Check that none of the pixels in the next column
                                // have been mapped into another rect
                                let tmp = (yyy * img.width) + rightEdge + 1;
                                if (mapped[tmp] != 0) {
                                    obstructions = true;
                                    break;
                                }
                                // Check the colors of the next column
                                img.getPixel(rightEdge + 1, yyy, tmpColor);
                                if (!Color.sameColor(currColor, tmpColor)) {
                                    obstructions = true;
                                    break;
                                }
                            }
                            if (!obstructions) {
                                // The next column matches the current one, so we successfully
                                // expanded in X. Mark all the pixels in the column as 'mapped'
                                rightEdge++;
                                for (let yyy = y; yyy <= bottomEdge && yyy < img.height; yyy++) {
                                    xxyyy = (yyy * img.width) + rightEdge;
                                    mapped[xxyyy]++;
                                }
                            } else {
                                // The next column has a pixel that doesn't match the current one,
                                // so stop expanding in that direction
                                expandX = false;
                            }
                        } else {
                            // Reached the right edge of the image
                            expandX = false;
                        }
                    } 
                    if (expandY) {
                        if ((bottomEdge+1) < img.height) {
                            // Try to expand 1 pixel downward
                            let obstructions = false;
                            for (let xxx = x; xxx <= rightEdge && xxx < img.width; xxx++) {
                                // Check that none of the pixels in the next column
                                // have been mapped into another rect
                                let tmp = ((bottomEdge + 1) * img.width) + xxx;
                                if (mapped[tmp] != 0) {
                                    obstructions = true;
                                    break;
                                }
                                // Check the colors of the next row
                                img.getPixel(xxx, bottomEdge + 1, tmpColor);
                                if (!Color.sameColor(currColor, tmpColor)) {
                                    obstructions = true;
                                    break;
                                }
                            }
                            if (!obstructions) {
                                // The next row matches the current one, so we successfully
                                // expanded in Y. Mark all the pixels in the row as 'mapped'
                                bottomEdge++;
                                for (let xxx = x; xxx <= rightEdge && xxx < img.width; xxx++) {
                                    xxxyy = (bottomEdge * img.width) + xxx;
                                    mapped[xxxyy]++;
                                }
                            } else {
                                // The next row has a pixel that doesn't match the current one,
                                // so stop expanding in that direction
                                expandY = false;
                            }
                        } else {
                            // Reached the bottom edge of the image
                            expandY = false;
                        }
                    }
                }
                let width = rightEdge - x + 1;
                let height = bottomEdge - y + 1; 
                rects.push(new Rect(x, y, width, height, currColor));
                // console.log(`Found rectangle #${numRects++} of ${width}x${height}`);
            }
        }
    }
    let mappedPixels = mapped.reduce((acc, val) => acc + val, 0);
    if (mappedPixels != (img.width * img.height)) {
        console.error(`Found rects covering ${mappedPixels} pixels, expected ${img.width * img.height}`);
    }
    return rects;
}

/**
 * Find the rectangles of the same color.
 * 
 * Greedy algorithm that tries to place bricks with the lowest cost-per-stud first.
 * For example assume:
 * A 1x1 brick costs $0.06 ($0.06 per stud)
 * A 2x1 brick costs $0.07 ($0.035 per stud)
 * A 3x1 brick costs $0.07 ($0.02333 per stud)
 * A 4x1 brick costs $0.12 ($0.03 per stud)
 * 
 * When filling a 4x1 rectangle, this will first place a 3x1 since that is cheapest. Then
 * it will place a 1x1 to fill the remaining space.
 * 
 * Since this already takes cost into account and only creates rectangles that match the
 * size of a brick, this routine effectively makes findBestCostBricks() a NOOP.
 * 
 * Returns an array of Rects
 * 
 * @param {*} img 
 */
function findRectsLowCPSFirst(img) {
    let rects = [];
    // Keeps track of which pixels have been assigned to a rect
    // TODO: Convert to a bitfield to save memory
    let mapped = new Array(img.width * img.height).fill(0);
    let sortedByCost = new Array();
    let tmpColor = [0, 0, 0, 0];

    // Prioritize bricks by price-per-stud
    for (const [width, heights] of brickCost.entries()) {
        if (heights === undefined) {
            continue;   // This is necessary because the array isn't really sparse; entries will return brickCost[5] :( 
        }
        for (const [height, cost] of heights.entries()) {
            let studs = width * height;
            if (studs === 0 || cost === undefined) {
                continue;
            }
            let cps = cost / studs;
            // console.log(`${width} x ${height}: ${cost}: cps: ${cps}`);
            sortedByCost.push([cps, width, height]);
            if (width != height) {
                sortedByCost.push([cps, height, width]);
            }
        }
    }
    // Sort by cost-per-stud. If 2 different-sized bricks have the same cps, prefer the larger brick.
    // Epsilon of 0.001 is arbitrary
    sortedByCost.sort((a, b) => Math.abs(a[0] - b[0]) < 0.001 ? b[1]*b[2] - a[1]*a[2] : a[0] - b[0]);

    // Iterate over bricks, top left to bottom right. Try to place the biggest bricks first
    for (let i = 0; i < sortedByCost.length; i++) {
        let brickW = sortedByCost[i][1];
        let brickH = sortedByCost[i][2];
        for (let y = 0; y <= (img.height - brickH); y++) {
            for (let x = 0; x <= (img.width - brickW); x++) {
                if (mapped[y * img.width + x] === 0) {
                    // Pixel hasn't been mapped yet
                    // Check whether the neighboring pixels are the same color
                    let currColor = [0, 0, 0, 0];
                    img.getPixel(x, y, currColor);
                    let rightEdge = x + brickW;
                    let bottomEdge = y + brickH;

                    // If all pixels in the brick are the same color and the brick doesn't 
                    // overlap another brick, we can place it
                    let obstructions = false;
                    for (let yyy = y; yyy < bottomEdge && !obstructions; yyy++) {
                        for (let xxx = x; xxx < rightEdge && !obstructions; xxx++) {
                            let tmpIndex = (yyy * img.width) + xxx;
                            if (mapped[tmpIndex] != 0) {
                                // console.log(`Can't place ${brickW}x${brickH} at ${x},${y} because it overlaps pixel at ${xxx},${yyy}`);
                                obstructions = true;
                            } else {
                                img.getPixel(xxx, yyy, tmpColor);
                                if (!Color.sameColor(currColor, tmpColor)) {
                                    // console.log(`Can't place ${brickW}x${brickH} at ${x},${y} because of difference color at ${xxx},${yyy}`);
                                    obstructions = true;
                                }
                            }
                        }
                    }
                    if (!obstructions) {
                        // Place the brick
                        // console.log(`Placing ${brickW}x${brickH} at ${x},${y}`);
                        rects.push(new Rect(x, y, brickW, brickH, currColor));
                        for (let yyy = y; yyy < bottomEdge && yyy < img.height; yyy++) {
                            for (let xxx = x; xxx < rightEdge && xxx < img.width; xxx++) {
                                let tmpIndex = (yyy * img.width) + xxx;
                                mapped[tmpIndex]++;
                            }
                        }
                    }
                }
            }
        }
    }
    for (let i = 0; i < mapped.length; i++) {
        if (mapped[i] != 1) {
            console.error(`Error: pixel index ${i} mapped ${mapped[i]} times (expected 1)`);
        }
    }
    return rects;
}

/**
 * Calculate the bill of materials for an image by calculating the set of bricks required
 * using the specified algorithm.
 * 
 * Returns a tuple of cost and an array of Bricks
 * 
 * @param {*} img
 * @param {*} algorithm Name of the algorithm to use, such as "singleLine"
 */
function calculateBOM(img, algorithm) {
    let bom = [];   // Brick objects: size, price, color, x/y coords of top left
    let totalCost = 0;
    let rects;
    switch(algorithm) {
        case "singlePixels":    rects = findRectsSinglePixels(img); break;
        case "singleLine":      rects = findRectsSingleLine(img);   break;
        case "multiLine":       rects = findRectsMultiLine(img);    break;
        case "expandingRects":  rects = findRectsExpanding(img);    break;
        case "lowCPSFirst":     rects = findRectsLowCPSFirst(img);  break;
        default:
            alert("Invalid BOM algorithm: " + algorithm);
    }
    for (rect of rects) {
        // For each rectangle, find the minimum set of bricks required to implement it
        const {cost, bricks} = findOptimalBricks(rect);
        bom.push(...bricks);
        totalCost += cost;
    }
    return {
        cost: totalCost,
        bom: bom,
    }
}
