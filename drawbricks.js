/**
 * Size (in pixels) to make each stud of the instructions.
 */
const INST_STUD_WIDTH = 10;

/**
 * Draw the bricks required for the mosaic
 * 
 * @param {*} e EventMessage from the main thread. e.data must contain a list of 
 * bricks and an ImageInfo
 */
function drawBricks(e) {
    let bricks = e.data.bom;
    let imgInfo = e.data.imgInfo;
    const INST_STUD_WIDTH = 10;
    const BORDER_COLOR = [0, 0, 0, 255];

    function setPixel(data, lineStride, pixelStride, x, y, pixel) {
        let xy = (y * lineStride) + (x * pixelStride);
        data[xy    ] = pixel[0];
        data[xy + 1] = pixel[1];
        data[xy + 2] = pixel[2];
        data[xy + 3] = pixel[3];
    }

    // Draw each brick
    for (const brick of bricks) {
        let x = brick.x * INST_STUD_WIDTH;
        let y = brick.y * INST_STUD_WIDTH;
        for (let yy = 0; yy < brick.height; yy++, y += INST_STUD_WIDTH) {
            x = brick.x * INST_STUD_WIDTH;
            for (let xx = 0; xx < brick.width; xx++, x += INST_STUD_WIDTH) {
                // Draw brick background
                for (let i = 0; i < INST_STUD_WIDTH; i++) {
                    for (let j = 0; j < INST_STUD_WIDTH; j++) {
                        setPixel(imgInfo.imageData.data, imgInfo.lineStride, imgInfo.pixelStride, 
                            x + j, y + i, brick.color);
                    }
                }
                // Draw brick borders
                if (yy == 0) {  // Top border
                    for (let i = 0; i < INST_STUD_WIDTH; i++) {
                        setPixel(imgInfo.imageData.data, imgInfo.lineStride, imgInfo.pixelStride,
                            x + i, y, BORDER_COLOR);
                    }
                }
                if (yy == (brick.height - 1)) { // Bottom border
                    for (let i = 0; i < INST_STUD_WIDTH; i++) {
                        setPixel(imgInfo.imageData.data, imgInfo.lineStride, imgInfo.pixelStride,
                            x + i, y + INST_STUD_WIDTH - 1, BORDER_COLOR);
                    }
                }
                if (xx == 0) {  // Left border
                    for (let i = 0; i < INST_STUD_WIDTH; i++) {
                        setPixel(imgInfo.imageData.data, imgInfo.lineStride, imgInfo.pixelStride,
                            x, y + i, BORDER_COLOR);
                    }
                }
                if (xx == brick.width - 1) {    // Right border
                    for (let i = 0; i < INST_STUD_WIDTH; i++) {
                        setPixel(imgInfo.imageData.data, imgInfo.lineStride, imgInfo.pixelStride,
                            x + INST_STUD_WIDTH - 1, y + i, BORDER_COLOR);
                    }
                }
            }
        }
    }
    postMessage({imgInfo: imgInfo});
}
