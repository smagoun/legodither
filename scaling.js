
/**
 * Wrapper for resizing functions that extracts an ImageInfo from the 
 * src/dest canvases and passes it them to the resize function.
 * 
 * @param {Function} fn Resizing function. First 3 inputs are be src/dest ImageInfo and scaleFactor
 * @param {HTMLCanvasElement} srcCanvas 
 * @param {HTMLCanvasElement} destCanvas 
 */
function resizeWrapper(fn, srcCanvas, destCanvas) {
    let srcImg = ImageInfo.fromCanvas(srcCanvas);
    let destImg = ImageInfo.fromCanvas(destCanvas);
    let xscale = srcImg.width / destImg.width;
    let yscale = srcImg.height / destImg.height;
    fn(srcImg, destImg, xscale, yscale);
    let destContext = destCanvas.getContext("2d");
    destContext.putImageData(destImg.imageData, 0, 0);
}

/**
 * Reduce the resolution of the source image and render it into the destination image
 * using a nearest-neighbor algorithm.
 * 
 * @param {ImageInfo} srcImg
 * @param {ImageInfo} destImg
 * @param {Number} xscale 1 / scale factor. 2 = downsample in x by 50%, 4 = downsample by 75%...
 * @param {Number} yscale 1 / scale factor. 2 = downsample in y by 50%, 4 = downsample by 75%...
 */
function resizeNearestNeighbor(srcImg, destImg, xscale, yscale) {
    let nearestPixel = [0, 0, 0, 0];
    for (let dy = 0; dy < destImg.height; dy++) {
        nearestY = Math.floor((dy + 0.5) * yscale);
        if (nearestY >= srcImg.height) {   // Clamp source to edge of image
            nearestY = srcImg.height - 1;
        }
        for (let dx = 0; dx < destImg.width; dx++) {
            nearestX = Math.floor((dx + 0.5) * xscale);
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
 * @param {ImageInfo} srcImg
 * @param {ImageInfo} destImg
 * @param {Number} xscale 1 / scale factor. 2 = downsample in x by 50%, 4 = downsample by 75%...
 * @param {Number} yscale 1 / scale factor. 2 = downsample in y by 50%, 4 = downsample by 75%...
 */
function resizeBox(srcImg, destImg, xscale, yscale) {
    let yradius = yscale / 2;   // distance from center to edge of dest pixel, in pixels of the src img
    let xradius = xscale / 2;   // distance from center to edge of dest pixel, in pixels of the src img

    let pixel = [0, 0, 0, 0];
    let output = [0, 0, 0, 0];
    for (let dy = 0; dy < destImg.height; dy++) {
        let dcenterY = (dy + 0.5) * yscale;
        let dtopY = dcenterY - yradius;
        let dbottomY = dcenterY + yradius;

        let rowTop = Math.max(Math.floor(dtopY), 0);
        let fracTop = Math.min(1.0 - (dtopY - rowTop), 1.0);   // Fraction of the top row to use
        let rowBottom = Math.min(Math.ceil(dbottomY), srcImg.height);
        let fracBottom = Math.min(1.0 - (rowBottom - dbottomY), 1.0); // Fraction of the bottom row to use

        for (let dx = 0; dx < destImg.width; dx++) {
            let dcenterX = (dx + 0.5) * xscale; // center of the dest pixel on the src img
            let dleftX = dcenterX - xradius;     // left edge of the dest pixel on the src img
            let drightX = dcenterX + xradius;    // right edge of the dest pixel on the src img

            let boxSize = 0;
            output[0] = 0;
            output[1] = 0;
            output[2] = 0;
            output[3] = 0;
            // upper left = dleftX, dtopY
            // bottom right = drightX, dbottomY
            let colLeft = Math.max(Math.floor(dleftX), 0);
            let fracLeft = Math.min(1.0 - (dleftX - colLeft));
            let colRight = Math.min(Math.ceil(drightX), srcImg.width);
            let fracRight = Math.min(1.0 - (colRight - drightX));
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
 * @param {ImageInfo} srcImg
 * @param {ImageInfo} destImg
 * @param {Number} xscale 1 / scale factor. 2 = downsample in x by 50%, 4 = downsample by 75%...
 * @param {Number} yscale 1 / scale factor. 2 = downsample in y by 50%, 4 = downsample by 75%...
 */
function resizeBilinear(srcImg, destImg, xscale, yscale) {
    let box = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ];
    for (let dy = 0; dy < destImg.height; dy++) {
        // dcenterX/Y are the center of the dest pixel on the src image
        // x1,y1 is the upper-left of the origin pixel in the 2x2 box of source pixels
        // we'll used for the filter. x2,y2 is the upper-left of the pixel at
        // 1,1 in the 2x2 box of source pixels.
        dcenterY = (dy + 0.5) * yscale;
        y1 = Math.floor(dcenterY - 0.5);
        for (let dx = 0; dx < destImg.width; dx++) {
            dcenterX = (dx + 0.5) * xscale;
            x1 = Math.floor(dcenterX - 0.5);

            let x2 = x1 + 1;
            let y2 = y1 + 1;
            // Ensure we don't read past the edge of the image
            if (x2 == srcImg.width)  { x2 = x1; }
            if (y2 == srcImg.height) { y2 = y1; }

            // Interpolation:
            // Find the distance from the dest pixel center to each of the edges
            // of the 2x2 box. Weight the src pixels accordingly
            let wx = 1.0 - (dcenterX - x1 - 0.5);
            let wy = 1.0 - (dcenterY - y1 - 0.5);
            let weights = [
                wx * wy,
                (1.0 - wx) * wy,
                wx * (1.0 - wy),
                (1.0 - wx) * (1.0 - wy),
            ];
            srcImg.getPixel(x1, y1, box[0]);
            srcImg.getPixel(x2, y1, box[1]);
            srcImg.getPixel(x1, y2, box[2]);
            srcImg.getPixel(x2, y2, box[3]);

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
