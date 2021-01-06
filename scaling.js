
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
            output[3] = 255;    // Ignore alpha, the rest of the pipeline doesn't handle it well
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

/**
 * Reduce the resolution of the source image and render it into the destination image
 * using a detail-preserving algorithm adapted from Weber et al.:
 * https://download.hrz.tu-darmstadt.de/media/FB20/GCC/dpid/Weber_2016_DPID.pdf
 * 
 * @param {ImageInfo} srcImg
 * @param {ImageInfo} destImg
 * @param {Number} xscale 1 / scale factor. 2 = downsample in x by 50%, 4 = downsample by 75%...
 * @param {Number} yscale 1 / scale factor. 2 = downsample in y by 50%, 4 = downsample by 75%...
 */
function resizeDetailPreserving(srcImg, destImg, xscale, yscale) {
    // Max Euclidean distance; 4 = # of channels (RGBA)
    const VMAX = Math.sqrt(4 * (255 ** 2));

    // Discrete 3x3 gaussian kernel
    const KERNEL = [
        [1, 2, 1],
        [2, 4, 2],
        [1, 2, 1],
    ];

    let yradius = yscale / 2;   // distance from center to edge of dest pixel, in pixels of the src img
    let xradius = xscale / 2;   // distance from center to edge of dest pixel, in pixels of the src img

    let pixel    = [0, 0, 0, 0];
    let avgPixel = [0, 0, 0, 0];
    let output   = [0, 0, 0, 0];

    let lambda = 1.0;

    // Calculate box-filtered image into an intermediate image
    // Uses Array (not Uint8ClampedArray) for better storage of intermediate values
    // TODO: Would Uint8ClampedArray work?
    let avgImgData = { data: new Array(destImg.width * destImg.height * destImg.pixelStride) };
    let avgImg = new ImageInfo(destImg.width, destImg.height, destImg.lineStride,
        destImg.pixelStride, avgImgData);
    resizeBox(srcImg, avgImg, xscale, yscale);

    // Calculate guidance image
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

            // Apply the 3x3 convolution kernel, ignoring pixels that are off
            // the edge of the image
            let r=0, g=0, b=0, a=0; // Accumulator pixel
            let accD = 0;           // Accumulator for denominator of kernel
            let xx = 0, yy = 0;
            let kk = 0;
            for (ky = 0; ky < 3; ky++) {
                for (kx = 0; kx < 3; kx++) {
                    xx = dx + kx - 1;   // Subtract one to center the kernel around dx/dy
                    yy = dy + ky - 1;
                    if (xx > 0 && yy > 0 && xx < avgImg.width && yy < avgImg.height) {
                        kk = KERNEL[ky][kx];
                        avgImg.getPixel(xx, yy, pixel);
                        r += kk * pixel[0];
                        g += kk * pixel[1];
                        b += kk * pixel[2];
                        a += kk * pixel[3];
                        accD += kk;
                    }
                }
            }

            // Normalize
            avgPixel = [r / accD, g / accD, b / accD, a / accD];

            // Calculate the output image
            let weight = 0;
            let oF = 0;

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
                    if (lambda === 0) {
                        weight = 1;
                    } else {
                        // Find Euclidean distance from the average
                        // RGB only - ignore alpha
                        let vr = (avgPixel[0] - pixel[0]) ** 2;
                        let vg = (avgPixel[1] - pixel[1]) ** 2;
                        let vb = (avgPixel[2] - pixel[2]) ** 2;
                        let va = (avgPixel[3] - pixel[3]) ** 2;
                        weight = Math.sqrt(vr + vg + vb + va);
                        // Normalize to [0-1] and boost
                        weight = weight / VMAX;
                        weight = weight ** lambda;
                    }

                    // Calculate fraction (weight) of the pixel to use in the box
                    if (y == rowTop)        weight = weight * fracTop;
                    if (y == rowBottom - 1) weight = weight * fracBottom;
                    if (x == colLeft)       weight = weight * fracLeft;
                    if (x == colRight - 1)  weight = weight * fracRight;

                    output[0] += pixel[0] * weight;
                    output[1] += pixel[1] * weight;
                    output[2] += pixel[2] * weight;
                    output[3] += pixel[3] * weight;
                    oF += weight;
                }
            }

            if (oF === 0) {
                // Result is same as box filter
                destImg.setPixel(dx, dy, avgPixel);
            } else {
                output[0] = output[0] / oF;
                output[1] = output[1] / oF;
                output[2] = output[2] / oF;
                output[3] = output[3] / oF;
                destImg.setPixel(dx, dy, output);
            }
        }
    }
}