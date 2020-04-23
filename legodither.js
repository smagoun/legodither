
/**
 * Image is RGBA, each pixel is 4 array elements:
 *       0             1             2             3
 * 0  |  0  1  2  3 |  4  5  6  7 |  8  9 10 11 | 12 13 14 15 |
 * 1  | 16 17 18 19 | 20 21 22 23 | 24 25 26 27 | 28 29 30 31 | 
 * 2  | 32 33 34 35 | 36 37 38 39 | 40 41 42 43 | 44 45 46 47 |
 * 3  | 48 49 50 51 | 52 53 54 55 | 56 57 58 59 | 60 61 62 63 |
 */

/**
 * 1x1 bricks are 8mm wide
 */
const brickWidth = 8;

/**
 * One element for each of R/G/B/A
 */
const pixelStride = 4;


/**
 * Reset the level adjustment sliders to their initial values
 */
function resetLevels() {
    document.getElementById("inputLevelsShadowInput").value="0";
    document.getElementById("inputLevelsMidpointInput").value="0.5";
    document.getElementById("inputLevelsHighlightInput").value="1.0";
    document.getElementById("outputLevelsShadowInput").value="0";
    document.getElementById("outputLevelsHighlightInput").value="1.0";
}

/**
 * Return the palette associated with the given palette name. Returns
 * 'null' for the special-case native palette.
 * 
 * @param {*} paletteName 
 */
function getPalette(paletteName) {
    let palette;
    switch (paletteName) {
        case "native":          palette = null;                         break;
        case "lego2016":        palette = new PaletteLEGO2016();        break;
        case "lego2016grays":   palette = new PaletteLEGO2016Grays();   break;
        case "peeron":          palette = new PalettePeeron();          break;
        case "mono":            palette = new PaletteMono();            break;
        case "3bitcolor":       palette = new Palette3BitColor();       break;
        case "2bitgray":        palette = new Palette2BitGray();        break;
        case "4bitgray":        palette = new Palette4BitGray();        break;
        case "8bitgray":        palette = new Palette8BitGray();        break;
        case "4bitcolormac":    palette = new Palette4BitColorMac();    break;
        case "websafe":         palette = new PaletteWebSafeColor();    break;
        default:
            alert("Couldn't find palette " + paletteName);
    }
    return palette;
}


/**
 * Return a resizing filter function.
 * 
 * @param {*} type 
 */
function getResizingFilter(type) {
    let func = derezBox;
    switch (type) {
        case "box":
            func = derezBox;
            break;
        case "nearestNeighbor":
            func = derezNearestNeighbor;
            break;
        case "bilinear":
            func = derezBilinear;
            break;
        default:
            alert("Unknown resizing filter " + type);
    }
    return func;
}


/**
 * Read the source image and draw a lego-ized version of it into the lego canvas.
 * 
 * Uses the 'transformed' and 'scratch' canvases as intermediate scratch space.
 */
function drawLego() {
    let srcCanvas = document.getElementById("originalCanvas");
    let scratchCanvas = document.getElementById("scratchCanvas");
    let transformedCanvas = document.getElementById("transformedCanvas");
    let outputCanvas = document.getElementById("legoCanvas");

    let scaleFactor = Number(document.getElementById("scaleInput").value);
    //let sharpenFactor = Number(document.getElementById("sharpenInput").value);

    let dithering = document.getElementById("ditheringInput").checked;

    let inputLevelsShadow = parseFloat(document.getElementById("inputLevelsShadowInput").value);
    let inputLevelsMidpoint = parseFloat(document.getElementById("inputLevelsMidpointInput").value);
    let inputLevelsHighlight = parseFloat(document.getElementById("inputLevelsHighlightInput").value);
    let outputLevelsShadow = parseFloat(document.getElementById("outputLevelsShadowInput").value);
    let outputLevelsHighlight = parseFloat(document.getElementById("outputLevelsHighlightInput").value);

    let p = document.getElementById("paletteSelect");
    let paletteName = p.options[p.selectedIndex].value;
    let palette = getPalette(paletteName);

    convolve(srcCanvas, transformedCanvas);

    // TODO: Should probably split the level adjustment into 2. Adjust input levels
    // before applying destructive transformations (convolutions, scaling), and
    // apply output levels on rendering
    adjustLevels(transformedCanvas, inputLevelsShadow, inputLevelsMidpoint, inputLevelsHighlight, outputLevelsShadow, outputLevelsHighlight);

    // Downsample the image using the selected algorithm
    // TODO: What is the ideal blur before downsizing? Box filter already blurs;
    // we need the blur for nearest-neighbor (and others?)
    let r = document.getElementById("resizeSelect");
    let resizeFilterName = r.options[r.selectedIndex].value;
    let resize = getResizingFilter(resizeFilterName);
    resize(transformedCanvas, scratchCanvas, scaleFactor);
    //renderScaled(scratchCanvas, transformedCanvas, scaleFactor);

    if (palette != null) {
        decolor(scratchCanvas, palette, dithering);
    }
    renderScaled(scratchCanvas, outputCanvas, Math.round(scaleFactor));

    renderStats(srcCanvas.width, srcCanvas.height, 'orig');

    // Calculate the size of the lego canvas by using the same clipping/scaling
    // rules as in the derez function
    let clipWidth = srcCanvas.width - (srcCanvas.width % scaleFactor);
    let clipHeight = srcCanvas.height - (srcCanvas.height % scaleFactor);
    let bricksX = Math.round(clipWidth / scaleFactor);
    let bricksY = Math.round(clipHeight / scaleFactor);
    renderStats(bricksX, bricksY, 'lego');
}

/**
 * Draw stats about the image. Uses the prefix to find the elements to render into.
 * 
 * @param {*} bricksX 
 * @param {*} bricksY 
 * @param {*} outputPrefix Prefix of the stats elements, such as 'lego' or 'orig'
 */
function renderStats(bricksX, bricksY, outputPrefix) {
    document.getElementById(outputPrefix + 'WidthBricks').textContent = bricksX;
    document.getElementById(outputPrefix + 'HeightBricks').textContent = bricksY;
    document.getElementById(outputPrefix + 'TotalBricks').textContent = (bricksX * bricksY);
    document.getElementById(outputPrefix + 'WidthMM').textContent = bricksX * brickWidth;
    document.getElementById(outputPrefix + 'HeightMM').textContent = bricksY * brickWidth;
    document.getElementById(outputPrefix + 'WidthInch').textContent = mmToIn(bricksX * brickWidth);
    document.getElementById(outputPrefix + 'HeightInch').textContent = mmToIn(bricksY * brickWidth);
}

/**
 * Reduce the resolution of the source image and render it into the destination image
 * using a bilinear interpolation algorithm.
 * 
 * @param scaleFactor {*} 1 / scale factor. 2 = downsample by 50%, 4 = downsample by 75%...
 */
function derezBilinear(srcCanvas, destCanvas, scaleFactor = 2) {
    let srcImg = getSrcImage(srcCanvas, scaleFactor);
    let destImg = getDestImage(srcCanvas, destCanvas, scaleFactor);

    destCanvas.setAttribute("width", destImg.width);
    destCanvas.setAttribute("height", destImg.height);

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
            let box = [
                srcImg.getPixel(nearestXInt, nearestYInt),
                srcImg.getPixel(nearestXInt + 1, nearestYInt),
                srcImg.getPixel(nearestXInt, nearestYInt + 1),
                srcImg.getPixel(nearestXInt + 1, nearestYInt + 1),
            ];

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
    let destContext = destCanvas.getContext("2d");
    destContext.putImageData(destImg.imageData, 0, 0);
}


/**
 * Create a canvas that is scaled down from the source by an integer scaling factor,
 * and return the corresponding ImageInfo. Clips the original canvas size if necessary
 * to ensure the source dimensions are an integer multiple of the destination.
 * 
 * @param {*} srcCanvas 
 * @param {*} destCanvas 
 * @param {*} scaleFactor 
 */
function getDestImage(srcCanvas, destCanvas, scaleFactor) {
    let clipWidth = 0, clipHeight = 0;
    // If scaleFactor is an int, ensure that the dimensions of the original are evenly divisible 
    // by the dimensions of the scaled canvas. To do this, clip odd-sized images, ensuring that we 
    // discard roughly an even amount of each edge if necessary. Backwards-compatibility for
    // integer-only implementation.
    if (Math.floor(scaleFactor) === scaleFactor) {
        clipWidth = srcCanvas.width - (srcCanvas.width % scaleFactor);
        clipHeight = srcCanvas.height - (srcCanvas.height % scaleFactor);
    } else {
        clipWidth = srcCanvas.width;
        clipHeight = srcCanvas.height;
    }

    let scaledWidth = Math.floor(clipWidth / scaleFactor);
    let scaledHeight = Math.floor(clipHeight / scaleFactor);
    console.log("scaled output image: " + scaledWidth + "x" + scaledHeight);

    let destContext = destCanvas.getContext("2d");
    let destImgData = destContext.getImageData(0, 0, scaledWidth, scaledHeight);
    let dest = new ImageInfo(scaledWidth, scaledHeight, destImgData.width * pixelStride, 
        pixelStride, destImgData)
    return dest;
}

/**
 * Create an ImageInfo from a canvas. Scales the image down by the given integer scale factor.
 * Clips the image in the canvas if necessary to ensure its dimensions are an even multiple
 * of the corresponding scaled-down image.
 * 
 * @param {*} canvas 
 * @param {*} scaleFactor 
 */
function getSrcImage(canvas, scaleFactor) {
    let offsetX = 0, offsetY = 0, clipWidth = 0, clipHeight = 0;
    // If scaleFactor is an int, ensure that the dimensions of the original are evenly divisible 
    // by the dimensions of the scaled canvas. To do this, clip odd-sized images, ensuring that we 
    // discard roughly an even amount of each edge if necessary. Backwards-compatibility for
    // integer-only implementation.
    if (Math.floor(scaleFactor) === scaleFactor) {
        clipWidth = canvas.width - (canvas.width % scaleFactor);
        clipHeight = canvas.height - (canvas.height % scaleFactor);
        offsetX = Math.floor((canvas.width - clipWidth) / 2);
        offsetY = Math.floor((canvas.height - clipHeight) / 2);
    } else {
        clipWidth = canvas.width;
        clipHeight = canvas.height;
    }

    let context = canvas.getContext("2d");
    let imgData = context.getImageData(offsetX, offsetY, clipWidth, clipHeight);
    let ret = new ImageInfo(clipWidth, clipHeight, clipWidth * pixelStride, pixelStride, imgData);
    return ret;
}

/**
 * Reduce the resolution of the source image and render it into the destination image
 * using a nearest-neighbor algorithm.
 * 
 * @param scaleFactor {*} 1 / scale factor. 2 = downsample by 50%, 4 = downsample by 75%...
 */
function derezNearestNeighbor(srcCanvas, destCanvas, scaleFactor = 2) {
    let srcImg = getSrcImage(srcCanvas, scaleFactor);
    let destImg = getDestImage(srcCanvas, destCanvas, scaleFactor);

    destCanvas.setAttribute("width", destImg.width);
    destCanvas.setAttribute("height", destImg.height);
    
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
            nearestPixel = srcImg.getPixel(nearestX, nearestY);
            destImg.setPixel(dx, dy, nearestPixel);
        }
    }
    let destContext = destCanvas.getContext("2d");
    destContext.putImageData(destImg.imageData, 0, 0);
}

/**
 * Reduce the resolution of the source image and render it into the destination image.
 * 
 * @param scaleFactor {*} 1 / scale factor. 2 = downsample by 50%, 4 = downsample by 75%...
 */
function derezBox(srcCanvas, destCanvas, scaleFactor = 2) {
    let srcImg = getSrcImage(srcCanvas, scaleFactor);
    let destImg = getDestImage(srcCanvas, destCanvas, scaleFactor);

    destCanvas.setAttribute("width", destImg.width);
    destCanvas.setAttribute("height", destImg.height);

    let radius = scaleFactor / 2;   // distance from center to edge of dest pixel, in pixels of the src img

    for (let dy = 0; dy < destImg.height; dy++) {
        let dcenterY = (dy + 0.5) * scaleFactor;
        let dtopY = dcenterY - radius;
        let dbottomY = dcenterY + radius;

        let rowTop = Math.floor(dtopY + 0.5);
        let rowBottom = Math.floor(dbottomY - 0.5);

        for (let dx = 0; dx < destImg.width; dx++) {
            let dcenterX = (dx + 0.5) * scaleFactor; // center of the dest pixel on the src img
            let dleftX = dcenterX - radius;     // left edge of the dest pixel on the src img
            let drightX = dcenterX + radius;    // right edge of the dest pixel on the src img

            let boxSize = 0;
            let output = [0, 0, 0, 0];
            // upper left = dleftX, dtopY
            // bottom right = drightX, dbottomY
            let colLeft = Math.floor(dleftX + 0.5);
            let colRight = Math.floor(drightX - 0.5);
            for (let y = rowTop; y <= rowBottom; y++) {
                for (let x = colLeft; x <= colRight; x++) {
                    let pixel = srcImg.getPixel(x, y);
                    output[0] += pixel[0];
                    output[1] += pixel[1];
                    output[2] += pixel[2];
                    output[3] += pixel[3];
                    boxSize++;
                }
            }
            output = output.map(x => x / boxSize);
            destImg.setPixel(dx, dy, output);
        }
    }
    let destContext = destCanvas.getContext("2d");
    destContext.putImageData(destImg.imageData, 0, 0);
}

/**
 * Draw a scaled-up version of the source canvas into the destination. Resizes the
 * destination to fit the scaled image.
 * 
 * @param {*} srcCanvas 
 * @param {*} destCanvas 
 * @param {*} scaleFactor Must be a positive integer
 */
function renderScaled(srcCanvas, destCanvas, scaleFactor) {
    let scaledWidth = srcCanvas.width * scaleFactor;
    let scaledHeight = srcCanvas.height * scaleFactor;

    let srcImg = ImageInfo.fromCanvas(srcCanvas);
    
    // Resize output canvas to avoid artifacts on the bottom + right edges if the
    // output image is smaller than the original canvas size
    destCanvas.setAttribute("width", scaledWidth);
    destCanvas.setAttribute("height", scaledHeight);
    let destImg = ImageInfo.fromCanvas(destCanvas);

    // sj is row index of original; dj is row index of scaled image
    for (let sj = 0, dj = 0; sj < srcImg.height; sj++, dj += scaleFactor) {
        // si is col index of original; di is col index of scaled image
        for (let si = 0, di = 0; si < srcImg.width; si++, di += scaleFactor) {
            let pixel = srcImg.getPixel(si, sj);

            // Draw the new value in each block of pixels
            for (let y = 0; y < scaleFactor; y++) {
                for (let x = 0; x < scaleFactor; x++) {
                    destImg.setPixel(di + x, dj + y, pixel);
                }
            }
        }
    }
    let destContext = destCanvas.getContext("2d");
    destContext.putImageData(destImg.imageData, 0, 0);
}

/**
 * Converts a number in mm to inches. Truncates to 1 decimal place
 * @param {*} dimension 
 */
function mmToIn(dimension) {
    return (dimension / 25.4).toString().match(/^-?\d+(?:\.\d{0,1})?/)[0];
}

/**
 * Convert an (s)RGB pixel to linear RGB values.
 * 
 * Adapted from http://www.ericbrasseur.org/gamma.html?i=1#formulas
 * 
 * Not sure it does what I want. :)
 * 
 * @param {*} pixel 
 */
function srgbToLinear(pixel) {
    let n = 0.055;
    let ret = [0, 0, 0, pixel[3]];  // Ignore alpha for now
    for (let i = 0; i < 3; i++) {
        if (pixel[i] <= 0.04045) {
            ret[i] = pixel[i] / 12.92;
        } else {
            ret[i] = ((n + pixel[i]) / (1 + n)) ** 2.4;
        }
    }
    return ret;
}

/**
 * Convert a linear RGB pixel value back to (s)RGB
 * 
 * Adapted from http://www.ericbrasseur.org/gamma.html?i=1#formulas
 * 
 * Not sure it does what I want. :)
 * 
 * @param {*} pixel 
 */
function linearToSRGB(pixel) {
    let n = 0.055;
    let ret = [0, 0, 0, pixel[3]];  // Ignore alpha for now
    for (let i = 0; i < 3; i++) {
        if (pixel[i] <= 0.0031308) {
            ret[i] = pixel[i] * 12.92;
        } else {
            ret[i] = (1 + n) * pixel[i]**(1/2.4) - n;
        }
    }
    return ret;
}

/**
 * Given an RGB input color, return the nearest color from the given palette.
 * 
 * Finds the nearest color using euclidean distance:
 * sqrt((r1 - r2)^2 + (g1 - g2)^2 + (b1 - b2)^2)
 * 
 * @param {*} palette 
 * @param {*} pixel 4-element array of RGBA
 */
function findNearestColor(palette, pixel) {
    let r = pixel[0];
    let g = pixel[1]; 
    let b = pixel[2];
    let newColor = [r, g, b, pixel[3]];     // Ignore the alpha channel for now

    let palR, palG, palB;

    let distance = Infinity;
    let dist;
    let pal = palette.getPalette();
    for (let n = 0; n < pal.length; n++) {
        palR = pal[n][0];
        palG = pal[n][1];
        palB = pal[n][2];

        dist = Math.sqrt(
                ((r - palR) * (r - palR)) + 
                ((g - palG) * (g - palG)) + 
                ((b - palB) * (b - palB))
                );
        if (dist < distance) {
            distance = dist;
            newColor[0] = palR;
            newColor[1] = palG;
            newColor[2] = palB;
        }
        if (dist === 0) {
            //alert("found exact color match!");
            break;
        }
    }
    return newColor;
}


/**
 * Utility function to clamp a value to an integer in the given range
 * 
 * @param {*} value 
 * @param {*} min 
 * @param {*} max 
 */
function clamp(value, min = 0, max = 255) {
    if (value < min) {
        return min;
    } else if (value > max) { 
        return max;
    } else { 
        return value;
    }
}

function updateKernel() {
    let p = document.getElementById("convolutionSelect");
    let kernelName = p.options[p.selectedIndex].value;
    let kernel = []
    switch (kernelName) {
        case "identity":
            kernel = [0, 0, 0, 
                      0, 1, 0,
                      0, 0, 0];
            break;
        case "lowpass":
            kernel = ["1/9", "1/9", "1/9", 
                      "1/9", "1/9", "1/9",
                      "1/9", "1/9", "1/9"];
            break;
        case "highpass":
            kernel = ["-1/9", "-1/9", "-1/9", 
                      "-1/9", "8/9+1", "-1/9",
                      "-1/9", "-1/9", "-1/9"];
            break;
        default:
            alert("Unknown convolution kernel " + kernelName);
            break;
    }
    for (y = 0, i = 0; y < 3; y++) {
        for (x = 0; x < 3; x++, i++) {
            document.getElementById("convolution" + i).value = kernel[i];
        }
    }
}

/**
 * Creates the kernel for the convolution filter input from the form.
 * 
 * Assumes (and returns) a 3x3 kernel.
 */
function getConvolutionKernel() {
    let kernel = [];
    let i = 0;
    for (y = 0; y < 3; y++) {
        let row = [];
        for (x = 0; x < 3; x++, i++) {
            // TODO: Security issue! Don't use eval()...
            row.push(eval(document.getElementById("convolution" + i).value));
        }
        kernel.push(row);
    }
    return kernel;
}

/**
 * Apply a convolution kernel to the image, placing the output in the destination
 * canvas.
 * 
 * @param {*} srcCanvas 
 * @param {*} destCanvas 
 */
function convolve(srcCanvas, destCanvas) {
    let kernel = getConvolutionKernel();

    let srcImg = ImageInfo.fromCanvas(srcCanvas);
    destCanvas.setAttribute("width", srcCanvas.width);
    destCanvas.setAttribute("height", srcCanvas.height);
    let destImg = ImageInfo.fromCanvas(destCanvas);

    for (y = 0; y < srcCanvas.height; y++) {
        for (x = 0; x < srcCanvas.width; x++) {
            origPixel = srcImg.getPixel(x, y);
            // Don't apply convolutions to edge cases where the filter needs to look
            // outside image boundaries
            if (x == 0 || y == 0 || x == (srcCanvas.width-1) || y == (srcCanvas.height-1)) {
                destImg.setPixel(x, y, origPixel);
                continue;
            }
            let r=0, g=0, b=0, a=0;
            for (ky = -1; ky < 2; ky++) {
                for (kx = -1; kx < 2; kx++) {
                    pixel = srcImg.getPixel(x+kx, y+ky);
                    r += kernel[ky + 1][kx + 1] * pixel[0];
                    g += kernel[ky + 1][kx + 1] * pixel[1];
                    b += kernel[ky + 1][kx + 1] * pixel[2];
                    a += pixel[3];  // Ignore alpha for now
                }
            }
            newPixel = [r, g, b, a];
            /* For unsharp mask...
            newPixel = [
                origPixel[0] + ((origPixel[0] - r) * factor),
                origPixel[1] + ((origPixel[1] - g) * factor),
                origPixel[2] + ((origPixel[2] - b) * factor),
                origPixel[3],   // Ignore alpha for now
            ];*/
            destImg.setPixel(x, y, newPixel);
        }
    }
    let destContext = destCanvas.getContext("2d");
    destContext.putImageData(destImg.imageData, 0, 0);
}


/**
 * Adjust shadow/highlight levels for a pixel
 * 
 * TODO: Split this so that output levels are handled separately, later in the pipeline
 * 
 * ALgorithms from https://stackoverflow.com/questions/39510072/algorithm-for-adjustment-of-image-levels
 * 
 * @param {*} pixel RGB pixel
 * @param {*} inShadow 
 * @param {*} inHighlight 
 * @param {*} outShadow 
 * @param {*} outHighlight 
 */
function adjustLevel(pixel, inShadow = 0.0, inMidpoint = 0.5, inHighlight = 1.0, outShadow = 0, outHighlight = 1.0) {
    let hsl = rgb2hsl(pixel);
    let lightness = hsl[2];

    // Calculate gamma
    let gamma = 1.0;
    let midNormal = inMidpoint;
    if (inMidpoint < 0.5) {
        midNormal = midNormal * 2;
        gamma = 1 + (9 * ( 1 - midNormal));
        gamma = Math.min(gamma, 9.99);
    } else if (inMidpoint > 0.5) {
        midNormal = (midNormal * 2 ) - 1;
        gamma = 1 - midNormal;
        gamma = Math.max(gamma, 0.01);
    }
    let gammaCorr = 1 / gamma;

    // Input levels
    let newLight = ((lightness - inShadow) / (inHighlight - inShadow));
    // Midpoint / gamma adjustment
    newLight = newLight ** gammaCorr;

    // Output levels
    newLight = newLight * (outHighlight - outShadow) + outShadow;
    
    let rgb = hsl2rgb([hsl[0], hsl[1], newLight]);
    return [clamp(rgb[0]), clamp(rgb[1]), clamp(rgb[2]), pixel[3]];  // Ignore alpha for now
}

function autoLevels() {
    let canvas = document.getElementById("originalCanvas");
    let img = ImageInfo.fromCanvas(canvas);

    let minL = 1.0;
    let maxL = 0.0;
    let medianL = 0.5;
    let lValues = [];
    for (let j = 0; j < img.height; j++) {
        for (let i = 0; i < img.width; i++) {
            let pixel = img.getPixel(i, j);
            hsl = rgb2hsl(pixel);
            lValues.push(hsl[2]);
        }
    }
    lValues.sort();
    minL = lValues[0];
    maxL = lValues[lValues.length - 1];
    let mid = Math.floor(lValues.length / 2); 
    if (lValues.length % 2 === 0) {
        medianL = (lValues[mid - 1] + lValues[mid]) / 2.0;
    } else {
        medianL = lValues[mid];
    }
    console.log("setting levels: min: " + minL + ", midpoint: " + medianL + ", max: " + maxL);

    document.getElementById("inputLevelsShadowInput").value=minL;
    // TODO: Leave this off for now, not clear we're setting this appropriately.
    //document.getElementById("inputLevelsMidpointInput").value=1 - medianL;
    document.getElementById("inputLevelsHighlightInput").value=maxL;
    document.getElementById("outputLevelsShadowInput").value="0";
    document.getElementById("outputLevelsHighlightInput").value="1.0";
}

/**
 * Returns hue (degrees in the range 0-360), saturation (range 0-1), and lightness 
 * (range 0-1).
 * 
 * @param {*} pixel 
 */
function rgb2hsl(pixel) {
    let r = pixel[0] / 255.0;
    let g = pixel[1] / 255.0;
    let b = pixel[2] / 255.0;

    let xmax = Math.max(r, g, b);
    let xmin = Math.min(r, g, b);

    let lightness = (xmax + xmin) / 2;
    let chroma = xmax - xmin;
    let hue;
    let sat;

    if (chroma === 0) {
        hue = 0;
        sat = 0;
    } else {
        sat = chroma / (1 - Math.abs((2 * lightness) - 1));
        switch (xmax) {
            case r:
                // The ternary at the end is to handle the case where hue is negative
                hue = ((g - b) / chroma) + (g < b ? 6 : 0);
                break;
            case g:
                hue = 2 + ((b - r ) / chroma);
                break;
            case b:
                hue = 4 + ((r - g) / chroma);
                break;
            default:
                alert("max isn't one of RGB!");
        }
        hue = hue * 60; // Convert to degrees
    }
    return [hue, sat, lightness];
}

/**
 * Returns an RGB pixel from the given hue [0-360 degrees], saturation [0-1], and lightness [0-1].
 * 
 * @param {*} hsl 
 */
function hsl2rgb(hsl) {
    let hue = hsl[0];
    let sat = hsl[1];
    let lightness = hsl[2];

    let c = (1 - Math.abs((2 * lightness) - 1)) * sat;
    let hh = hue / 60;
    let x = c * (1 - Math.abs((hh % 2) - 1));
    let rgb;
    hc = Math.ceil(hh);
    switch (hc) {
        case 0:
        case 1: rgb = [c, x, 0];   break;
        case 2: rgb = [x, c, 0];   break;
        case 3: rgb = [0, c, x];   break;
        case 4: rgb = [0, x, c];   break;
        case 5: rgb = [x, 0, c];   break;
        case 6: rgb = [c, 0, x];   break;
        default:
            console.log("hc isn't expected: " + hc + ": " + hsl[0], + ", " + hsl[1] + ", " + hsl[2]);
            rgb = [0, 0, 0];
    }
    let m = lightness - (c / 2);
    // Add lightness
    rgb = [
        clamp(Math.round((rgb[0] + m) * 255)), 
        clamp(Math.round((rgb[1] + m) * 255)), 
        clamp(Math.round((rgb[2] + m) * 255))
    ];
    return rgb;
}


/**
 * Adjust shadow/highlight levels for the image
 * 
 * TODO: Split this so that output levels are handled separately, later in the pipeline
 * 
 * @param {*} canvas 
 * @param {*} inShadow 
 * @param {*} inMidpoint 
 * @param {*} inHighlight 
 * @param {*} outShadow 
 * @param {*} outHighlight 
 */
function adjustLevels(canvas, inShadow, inMidpoint, inHighlight, outShadow, outHighlight) {
    let img = ImageInfo.fromCanvas(canvas);
    for (let j = 0; j < img.height; j++) {
        for (let i = 0; i < img.width; i++) {
            let pixel = img.getPixel(i, j);
            let newPixel = adjustLevel(pixel, inShadow, inMidpoint, inHighlight, outShadow, outHighlight);
            img.setPixel(i, j, newPixel);
        }
    }
    let context = canvas.getContext("2d");
    context.putImageData(img.imageData, 0, 0);
}


/**
 * Color-quantize the canvas's image with the given color palette. Dithers using
 * Floyd-Steinberg.
 * 
 * @param {*} canvas
 * @param {*} palette
 * @param {*} dithering True to enable Floyd-Steinberg dithering
 */
function decolor(canvas, palette, dithering = true) {
    let img = ImageInfo.fromCanvas(canvas);

/* 
Implement Floyd-Steinberg dithering:
    for each y from top to bottom do
        for each x from left to right do
            oldpixel := pixel[x][y]
            newpixel := find_closest_palette_color(oldpixel)
            pixel[x][y] := newpixel
            quant_error := oldpixel - newpixel
            pixel[x + 1][y    ] := pixel[x + 1][y    ] + quant_error × 7 / 16
            pixel[x - 1][y + 1] := pixel[x - 1][y + 1] + quant_error × 3 / 16
            pixel[x    ][y + 1] := pixel[x    ][y + 1] + quant_error × 5 / 16
            pixel[x + 1][y + 1] := pixel[x + 1][y + 1] + quant_error × 1 / 16
*/
    for (let j = 0; j < img.height; j++) {
        for (let i = 0; i < img.width; i++) {
            let pixel = img.getPixel(i, j);

            // Find the nearest color in the palette
            let nearest = findNearestColor(palette, pixel);

            // Draw the new value in each block of pixels
            img.setPixel(i, j, nearest);

            if (dithering) {
                // Calculate quantization error
                let errR = pixel[0] - nearest[0];
                let errG = pixel[1] - nearest[1];
                let errB = pixel[2] - nearest[2];
                let errA = pixel[3] - nearest[3];

                /* pixel[x + 1][y    ] := pixel[x + 1][y    ] + quant_error × 7 / 16 */
                if ((i+1) < img.width) {
                    let tmpPixel = img.getPixel(i+1, j);
                    let tmpR = tmpPixel[0] + parseInt(errR * 7 / 16);
                    let tmpG = tmpPixel[1] + parseInt(errG * 7 / 16);
                    let tmpB = tmpPixel[2] + parseInt(errB * 7 / 16);
                    let tmpA = tmpPixel[3] + parseInt(errA * 7 / 16);
                    img.setPixel(i+1, j, [tmpR, tmpG, tmpB, tmpA]);
                }

                /* pixel[x - 1][y + 1] := pixel[x - 1][y + 1] + quant_error × 3 / 16 */
                if (((i-1) >= 0) && ((j+1) < img.height)) {
                    let tmpPixel = img.getPixel(i-1, j+1);
                    let tmpR = tmpPixel[0] + parseInt(errR * 3 / 16);
                    let tmpG = tmpPixel[1] + parseInt(errG * 3 / 16);
                    let tmpB = tmpPixel[2] + parseInt(errB * 3 / 16);
                    let tmpA = tmpPixel[3] + parseInt(errA * 3 / 16);
                    img.setPixel(i-1, j+1, [tmpR, tmpG, tmpB, tmpA]);
                }

                /* pixel[x    ][y + 1] := pixel[x    ][y + 1] + quant_error × 5 / 16 */
                if ((j+1) < img.height) {
                    let tmpPixel = img.getPixel(i, j+1);
                    let tmpR = tmpPixel[0] + parseInt(errR * 5 / 16);
                    let tmpG = tmpPixel[1] + parseInt(errG * 5 / 16);
                    let tmpB = tmpPixel[2] + parseInt(errB * 5 / 16);
                    let tmpA = tmpPixel[3] + parseInt(errA * 5 / 16);
                    img.setPixel(i, j+1, [tmpR, tmpG, tmpB, tmpA]);
                }

                /* pixel[x + 1][y + 1] := pixel[x + 1][y + 1] + quant_error × 1 / 16 */
                if (((i+1) < img.width) && ((j+1) < img.height)) {
                    let tmpPixel = img.getPixel(i+1, j+1);
                    let tmpR = tmpPixel[0] + parseInt(errR * 1 / 16);
                    let tmpG = tmpPixel[1] + parseInt(errG * 1 / 16);
                    let tmpB = tmpPixel[2] + parseInt(errB * 1 / 16);
                    let tmpA = tmpPixel[3] + parseInt(errA * 1 / 16);
                    img.setPixel(i+1, j+1, [tmpR, tmpG, tmpB, tmpA]);
                }
            }
        }
    }
    let context = canvas.getContext("2d");
    context.putImageData(img.imageData, 0, 0);
}
