
/**
 * Wrapper for resizing functions that extracts an ImageInfo from the 
 * src/dest canvases and passes it them to the resize function.
 * 
 * @param {Function} fn Resizing function. First 3 inputs are be src/dest ImageInfo and scaleFactor
 * @param {HTMLCanvasElement} srcCanvas 
 * @param {HTMLCanvasElement} destCanvas 
 * @param {number} scaleFactor 
 */
function resizeWrapper(fn, srcCanvas, destCanvas, scaleFactor = 2) {
    let srcImg = ImageInfo.fromCanvas(srcCanvas);
    let destImg = ImageInfo.fromCanvas(destCanvas);
    fn(srcImg, destImg, scaleFactor);
    let destContext = destCanvas.getContext("2d");
    destContext.putImageData(destImg.imageData, 0, 0);
}

/**
 * Reduce the resolution of the source image and render it into the destination image
 * using a nearest-neighbor algorithm.
 * 
 * @param scaleFactor {*} 1 / scale factor. 2 = downsample by 50%, 4 = downsample by 75%...
 */
function resizeNearestNeighbor(srcImg, destImg, scaleFactor = 2) {
    let nearestPixel = [0, 0, 0, 0];
    for (let dy = 0; dy < destImg.height; dy++) {
        nearestY = Math.floor((dy + 0.5) * scaleFactor);
        if (nearestY >= srcImg.height) {   // Clamp source to edge of image
            nearestY = srcImg.height - 1;
        }
        for (let dx = 0; dx < destImg.width; dx++) {
            nearestX = Math.floor((dx + 0.5) * scaleFactor);
            if (nearestX >= srcImg.width) {    // Clamp to edge of image
                nearestX = srcImg.width - 1;
            }
            srcImg.getPixel(nearestX, nearestY, nearestPixel);
            destImg.setPixel(dx, dy, nearestPixel);
        }
    }
}

/**
 * Reduce the resolution of the source image and render it into the destination image.
 * 
 * @param scaleFactor {*} 1 / scale factor. 2 = downsample by 50%, 4 = downsample by 75%...
 */
function resizeBox(srcImg, destImg, scaleFactor = 2) {
    let radius = scaleFactor / 2;   // distance from center to edge of dest pixel, in pixels of the src img

    let pixel = [0, 0, 0, 0];
    let output = [0, 0, 0, 0];
    for (let dy = 0; dy < destImg.height; dy++) {
        let dcenterY = (dy + 0.5) * scaleFactor;
        let dtopY = dcenterY - radius;
        let dbottomY = dcenterY + radius;

        let rowTop = Math.floor(dtopY);
        let fracTop = 1.0 - (dtopY - rowTop);   // Fraction of the top row to use
        let rowBottom = Math.ceil(dbottomY);
        let fracBottom = 1.0 - (rowBottom - dbottomY); // Fraction of the bottom row to use

        for (let dx = 0; dx < destImg.width; dx++) {
            let dcenterX = (dx + 0.5) * scaleFactor; // center of the dest pixel on the src img
            let dleftX = dcenterX - radius;     // left edge of the dest pixel on the src img
            let drightX = dcenterX + radius;    // right edge of the dest pixel on the src img

            let boxSize = 0;
            output[0] = 0;
            output[1] = 0;
            output[2] = 0;
            output[3] = 0;
            // upper left = dleftX, dtopY
            // bottom right = drightX, dbottomY
            let colLeft = Math.floor(dleftX);
            let fracLeft = 1.0 - (dleftX - colLeft);
            let colRight = Math.ceil(drightX);
            let fracRight = 1.0 - (colRight - drightX);
            for (let y = rowTop; y < rowBottom; y++) {
                for (let x = colLeft; x < colRight; x++) {
                    srcImg.getPixel(x, y, pixel);
                    // Calculate fraction (weight) of the pixel to use in the box
                    let weight = 1.0;
                    if (y == rowTop)        weight = weight * fracTop;
                    if (y == rowBottom - 1) weight = weight * fracBottom;
                    if (x == colLeft)       weight = weight * fracLeft;
                    if (x == colRight - 1)  weight = weight * fracRight;

                    output[0] += pixel[0] * weight;
                    output[1] += pixel[1] * weight;
                    output[2] += pixel[2] * weight;
                    output[3] += pixel[3] * weight;
                    boxSize += weight;
                }
            }
            output[0] = output[0] / boxSize;
            output[1] = output[1] / boxSize;
            output[2] = output[2] / boxSize;
            output[3] = output[3] / boxSize;
            destImg.setPixel(dx, dy, output);
        }
    }
}

/**
 * Reduce the resolution of the source image and render it into the destination image
 * using a bilinear interpolation algorithm.
 * 
 * @param scaleFactor {*} 1 / scale factor. 2 = downsample by 50%, 4 = downsample by 75%...
 */
function resizeBilinear(srcImg, destImg, scaleFactor = 2) {
    let box = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ];
    for (let dy = 0; dy < destImg.height; dy++) {
        nearestY = (dy + 0.5) *  scaleFactor;
        nearestYInt = Math.floor(nearestY);
        deltaY = nearestY - nearestYInt;
        for (let dx = 0; dx < destImg.width; dx++) {
            nearestX = (dx + 0.5) * scaleFactor;
            nearestXInt = Math.floor(nearestX);
            deltaX = nearestX - nearestXInt;

            // Weighted sum; order must match order of pixels in 'box'
            let weights = [
                (1 - deltaX) * (1 - deltaY),    // 0, 0
                deltaX * (1 - deltaY),          // 1, 0
                (1 - deltaX) * deltaY,          // 0, 1
                deltaX * deltaY,                // 1, 1
            ];
            srcImg.getPixel(nearestXInt, nearestYInt, box[0]);
            srcImg.getPixel(nearestXInt + 1, nearestYInt, box[1]);
            srcImg.getPixel(nearestXInt, nearestYInt + 1, box[2]);
            srcImg.getPixel(nearestXInt + 1, nearestYInt + 1, box[3]);

            // Sum the weighted values of each pixel to find the output pixel
            let outputPixel = [0, 0, 0, 255];   // Ignore alpha for now
            for (let i = 0; i <= 3; i++) {
                let weighted = box[i].map(x => x * weights[i]);
                outputPixel[0] += weighted[0];
                outputPixel[1] += weighted[1];
                outputPixel[2] += weighted[2];
            }
            destImg.setPixel(dx, dy, outputPixel);
        }
    }
}
