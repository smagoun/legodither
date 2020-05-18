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
    let pixel = [0, 0, 0, 0];
    for (let j = 0; j < img.height; j++) {
        for (let i = 0; i < img.width; i++) {
            img.getPixel(i, j, pixel);
            adjustLevel(pixel, inShadow, inMidpoint, inHighlight, outShadow, outHighlight);
            img.setPixel(i, j, pixel);
        }
    }
    let context = canvas.getContext("2d");
    context.putImageData(img.imageData, 0, 0);
}

/**
 * Adjust shadow/highlight levels for a pixel.
 * 
 * Side effect: modifies pixel directly. Does not return a value.
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
    rgb2hsl(pixel);
    let lightness = pixel[2];

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
    
    pixel[2] = newLight;
    hsl2rgb(pixel);
}

function autoLevels() {
    let canvas = document.getElementById("originalCanvas");
    let img = ImageInfo.fromCanvas(canvas);

    let minL = 1.0;
    let maxL = 0.0;
    let medianL = 0.5;
    let lValues = [];
    let pixel = [0, 0, 0, 0];
    for (let j = 0; j < img.height; j++) {
        for (let i = 0; i < img.width; i++) {
            img.getPixel(i, j, pixel);
            rgb2hsl(pixel);
            lValues.push(pixel[2]);
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
 * Adjust the brightness of the image.
 * 
 * @param {*} canvas 
 * @param {*} factor Brightness adjustment from -255 to +255. 0 is default.
 */
function brightness(canvas, factor) {
    let img = ImageInfo.fromCanvas(canvas);
    let pixel = [0, 0, 0, 0];
    for (let j = 0; j < img.height; j++) {
        for (let i = 0; i < img.width; i++) {
            img.getPixel(i, j, pixel);
            pixel[0] = clamp(pixel[0] + factor);
            pixel[1] = clamp(pixel[1] + factor);
            pixel[2] = clamp(pixel[2] + factor);
            img.setPixel(i, j, pixel);
        }
    }
    let context = canvas.getContext("2d");
    context.putImageData(img.imageData, 0, 0);
}

/**
 * Adjust the saturation of the image.
 * 
 * @param {*} canvas 
 * @param {*} factor Saturation adjustment factor. 1.0 is default.
 */
function saturate(canvas, factor) {
    let img = ImageInfo.fromCanvas(canvas);
    let pixel = [0, 0, 0, 0];
    for (let j = 0; j < img.height; j++) {
        for (let i = 0; i < img.width; i++) {
            img.getPixel(i, j, pixel);
            rgb2hsl(pixel);
            pixel[1] = Math.min(pixel[1] * factor, 1.0);
            hsl2rgb(pixel);
            img.setPixel(i, j, pixel);
        }
    }
    let context = canvas.getContext("2d");
    context.putImageData(img.imageData, 0, 0);
}

/**
 * Adjust the contrast of the image.
 * 
 * @param {*} canvas 
 * @param {*} factor Contrast adjustment from -255 to +255. 0 is default.
 */
function contrast(canvas, factor) {
    // From https://stackoverflow.com/questions/2976274/adjust-bitmap-image-brightness-contrast-using-c
    let newFactor = (259.0 * (factor + 255.0)) / (255.0 * (259.0 - factor));
    let img = ImageInfo.fromCanvas(canvas);
    let pixel = [0, 0, 0, 0];
    for (let j = 0; j < img.height; j++) {
        for (let i = 0; i < img.width; i++) {
            img.getPixel(i, j, pixel);
            pixel[0] = clamp((newFactor * (pixel[0] - 128) + 128));
            pixel[1] = clamp((newFactor * (pixel[1] - 128) + 128));
            pixel[2] = clamp((newFactor * (pixel[2] - 128) + 128));
            img.setPixel(i, j, pixel);
        }
    }
    let context = canvas.getContext("2d");
    context.putImageData(img.imageData, 0, 0);
}

/**
 * Apply an unsharp mask to the image, placing the output in the destination
 * canvas.
 * 
 * @param {*} srcCanvas 
 * @param {*} destCanvas 
 * @param {*} factor
 */
function unsharpMask(srcCanvas, destCanvas, factor) {
    // TODO: don't steal the convolution filter for this
    let kernel = getConvolutionKernel();

    let srcImg = ImageInfo.fromCanvas(srcCanvas);
    destCanvas.setAttribute("width", srcCanvas.width);
    destCanvas.setAttribute("height", srcCanvas.height);
    let destImg = ImageInfo.fromCanvas(destCanvas);

    let origPixel = [0, 0, 0, 0];
    let pixel = [0, 0, 0, 0];
    let newPixel = [0, 0, 0, 0];
    for (y = 0; y < srcCanvas.height; y++) {
        for (x = 0; x < srcCanvas.width; x++) {
            srcImg.getPixel(x, y, origPixel);
            // Don't apply convolutions to edge cases where the filter needs to look
            // outside image boundaries
            if (x == 0 || y == 0 || x == (srcCanvas.width-1) || y == (srcCanvas.height-1)) {
                destImg.setPixel(x, y, origPixel);
                continue;
            }
            // TODO: Use a gaussian blur to find the low-frequency data. For now
            // borrow the convolution kernel. Could also use a box blur for this.
            let r=0, g=0, b=0, a=0;
            for (ky = -1; ky < 2; ky++) {
                for (kx = -1; kx < 2; kx++) {
                    srcImg.getPixel(x+kx, y+ky, pixel);
                    r += kernel[ky + 1][kx + 1] * pixel[0];
                    g += kernel[ky + 1][kx + 1] * pixel[1];
                    b += kernel[ky + 1][kx + 1] * pixel[2];
                    a += pixel[3];  // Ignore alpha for now
                }
            }
            // Subtract the low-frequency components from the high-frequency components,
            // then combine them with the original to get the sharpened original
            newPixel = [
                origPixel[0] + ((origPixel[0] - r) * factor),
                origPixel[1] + ((origPixel[1] - g) * factor),
                origPixel[2] + ((origPixel[2] - b) * factor),
                origPixel[3],   // Ignore alpha for now
            ];
            destImg.setPixel(x, y, newPixel);
        }
    }
    let destContext = destCanvas.getContext("2d");
    destContext.putImageData(destImg.imageData, 0, 0);
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

    let origPixel = [0, 0, 0, 0];
    let pixel = [0, 0, 0, 0];
    for (y = 0; y < srcCanvas.height; y++) {
        for (x = 0; x < srcCanvas.width; x++) {
            srcImg.getPixel(x, y, origPixel);
            // Don't apply convolutions to edge cases where the filter needs to look
            // outside image boundaries
            if (x == 0 || y == 0 || x == (srcCanvas.width-1) || y == (srcCanvas.height-1)) {
                destImg.setPixel(x, y, origPixel);
                continue;
            }
            let r=0, g=0, b=0, a=0;
            for (ky = -1; ky < 2; ky++) {
                for (kx = -1; kx < 2; kx++) {
                    srcImg.getPixel(x+kx, y+ky, pixel);
                    r += kernel[ky + 1][kx + 1] * pixel[0];
                    g += kernel[ky + 1][kx + 1] * pixel[1];
                    b += kernel[ky + 1][kx + 1] * pixel[2];
                    a += pixel[3];  // Ignore alpha for now
                }
            }
            newPixel = [r, g, b, a];
            destImg.setPixel(x, y, newPixel);
        }
    }
    let destContext = destCanvas.getContext("2d");
    destContext.putImageData(destImg.imageData, 0, 0);
}
