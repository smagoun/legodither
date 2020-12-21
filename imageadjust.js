/**
 * Adjust levels, brightness, saturation, and constrast. Intended to be run before
 * downsampling.
 * 
 * TODO: Split output levels to be handled separately, later in the pipeline
 * 
 * @param {*} canvas 
 * @param {*} inShadow 
 * @param {*} inMidpoint 
 * @param {*} inHighlight 
 * @param {*} outShadow 
 * @param {*} outHighlight 
 * @param {*} brightFactor Brightness adjustment from -255 to +255. 0 is default.
 * @param {*} satFactor Saturation adjustment factor. 1.0 is default.
 * @param {*} contrastFactor Contrast adjustment from -255 to +255. 0 is default.
 */
function preprocess(canvas, inShadow, inMidpoint, inHighlight, outShadow, outHighlight, 
        brightFactor, satFactor, contrastFactor) {
    let img = ImageInfo.fromCanvas(canvas);
    let pixel = [0, 0, 0, 0];
    // From https://stackoverflow.com/questions/2976274/adjust-bitmap-image-brightness-contrast-using-c
    let newContrast = (259.0 * (contrastFactor + 255.0)) / (255.0 * (259.0 - contrastFactor));
    let lineStride = img.lineStride;
    let pixelStride = img.pixelStride;
    let xy = 0;
    let data = img.data;
    let gammaCache = createGammaCache(inShadow, inMidpoint, inHighlight);
    for (let j = 0; j < img.height; j++) {
        xy = j * lineStride;
        for (let i = 0; i < img.width; i++) {
            // Inline getPixel() for performance
            pixel[0] = data[xy    ];
            pixel[1] = data[xy + 1];
            pixel[2] = data[xy + 2];
            pixel[3] = data[xy + 3];
            // Levels + saturation use HSL
            rgb2hsl(pixel);
            adjustLevel(pixel, outShadow, outHighlight, gammaCache);
            // Saturation
            pixel[1] = Math.min(pixel[1] * satFactor, 1.0);
            hsl2rgb(pixel);
            // Brightness is (pixel + brightFactor)
            // Contrast is (newContrast * (pixel - 128) + 128)
            // Inline setPixel() for performance; clamp() is necessary for performance
            // too even though we're writing into a Uint8ClampedArray (tested on Chrome 87)
            data[xy    ] = clamp((newContrast * (pixel[0] + brightFactor) - 128) + 128);
            data[xy + 1] = clamp((newContrast * (pixel[1] + brightFactor) - 128) + 128);
            data[xy + 2] = clamp((newContrast * (pixel[2] + brightFactor) - 128) + 128);
            data[xy + 3] = clamp(pixel[3]);
            xy += pixelStride;
        }
    }
    let context = canvas.getContext("2d");
    context.putImageData(img.imageData, 0, 0);
}

/**
 * Calculate gamma correction factor based on the new midpoint
 * 
 * @param {number} inMidpoint Midpoint ranges from 0.0 - 1.0
 */
function calcGammaCorrection(inMidpoint = 0.5) {
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
    return 1 / gamma;
}
/**
 * Precompute gamma corrections for the given input levels
 * 
 * @param {*} inShadow 
 * @param {*} inMidpoint 
 * @param {*} inHighlight 
 * @returns Map of corrections, keyed by HSL lightness value [0-1]
 */
function createGammaCache(inShadow, inMidpoint, inHighlight) {
    let ret = new Map();
    let lightness = 0.0;
    let gammaCorr = calcGammaCorrection(inMidpoint);
    for (let i = 0; i < 256; i++) {
        for (let j = 0; j < 256; j++) {
            lightness = (i/255.0 + j/255.0) / 2;
            ret.set(lightness, ((lightness - inShadow) / (inHighlight - inShadow)) ** gammaCorr);
        }
    }
    return ret;
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
 * @param {*} pixel HSLA pixel (must be converted from RGBA via rgb2hsl())
 * @param {*} outShadow 
 * @param {*} outHighlight 
 * @param {Map} gammaCache Precomputed gamma corrections
 */
function adjustLevel(pixel, outShadow = 0, outHighlight = 1.0, gammaCache) {
    // Gamma-adjusted input levels
    let lightness = pixel[2];
    let newLight = gammaCache.get(lightness);
    // Output levels
    newLight = newLight * (outHighlight - outShadow) + outShadow;
    pixel[2] = newLight;
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
 * Apply an unsharp mask to the image, placing the output in the destination
 * canvas.
 * 
 * @param {*} srcCanvas 
 * @param {*} destCanvas 
 * @param {*} factor
 */
function unsharpMask(srcCanvas, destCanvas, factor) {
    const kernel = [    // 3x3 Gaussian
        [1, 2, 1],
        [2, 4, 2],
        [1, 2, 1],
    ].map(x => x.map(y => y / 16));

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
