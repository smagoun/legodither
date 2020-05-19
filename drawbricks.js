/**
 * Size (in pixels) to make each stud of the instructions.
 */
const INST_STUD_WIDTH = 10;

/**
 * Draw the bricks required for the mosaic
 * 
 * @param {*} bricks Array of Brick objects
 * @param {*} canvas 
 * @param {*} width Width of the image in bricks
 * @param {*} height Height of the image in bricks
 */
function drawBricks(bricks, canvas, width, height) {
    const canvasWidth = width * INST_STUD_WIDTH;
    const canvasHeight = height * INST_STUD_WIDTH;
    canvas.setAttribute("width", canvasWidth);
    canvas.setAttribute("height", canvasHeight);
    const ctx = canvas.getContext("2d");

    // Draw each brick
    for (const brick of bricks) {
        const x = brick.x * INST_STUD_WIDTH;
        const y = brick.y * INST_STUD_WIDTH;
        ctx.strokeRect(x, y, brick.width * INST_STUD_WIDTH, brick.height * INST_STUD_WIDTH);
    }
}
