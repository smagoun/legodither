
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
 * Return the palette associated with the given palette name
 * 
 * @param {*} paletteName 
 */
function getPalette(paletteName) {
    let palette;
    switch (paletteName) {
        case "lego2016":
            palette = PaletteLEGO2016.getPalette();
            break;
        case "lego2016grays":
            palette = PaletteLEGO2016Grays.getPalette();
            break;
        case "peeron":
            palette = PalettePeeron.getPalette();
            break;
        case "mono":
            palette = PaletteMono.getPalette();
            break;
        case "3bitcolor":
            palette = Palette3BitColor.getPalette();
            break;
        case "2bitgray":
            palette = Palette2BitGray.getPalette();
            break;
        case "4bitcolormac":
            palette = Palette4BitColorMac.getPalette();
            break;
        default:
            alert("Couldn't find palette " + paletteName);
    }
    return palette;
}


/**
 * Read the source image and draw a lego-ized version of it into the lego canvas.
 * 
 * Uses the 'transformed' and 'scratch' canvases as intermediate scratch space.
 */
function drawLego() {
    let srcCanvas = document.getElementById("originalCanvas");
    let scratchCanvas = document.getElementById("scratchCanvas");
    //let transformedCanvas = document.getElementById("transformedCanvas");
    let outputCanvas = document.getElementById("legoCanvas");

    let scaleFactor = parseInt(document.getElementById("scaleInput").value);
    let sharpenFactor = parseInt(document.getElementById("sharpenInput").value);

    let p = document.getElementById("paletteSelect");
    let paletteName = p.options[p.selectedIndex].value;
    let palette = getPalette(paletteName);

    sharpen(srcCanvas, transformedCanvas, sharpenFactor);

    derez(transformedCanvas, scratchCanvas, scaleFactor);
    //renderScaled(scratchCanvas, transformedCanvas, scaleFactor);

    decolor(scratchCanvas, palette);
    renderScaled(scratchCanvas, outputCanvas, scaleFactor);

    renderStats(srcCanvas.width, srcCanvas.height, 'orig');

    // Calculate the size of the lego canvas by using the same clipping/scaling
    // rules as in the derez function
    let clipWidth = srcCanvas.width - (srcCanvas.width % scaleFactor);
    let clipHeight = srcCanvas.height - (srcCanvas.height % scaleFactor);
    let bricksX = clipWidth / scaleFactor;
    let bricksY = clipHeight / scaleFactor;
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
 * Reduce the resolution of the source image and render it into the destination image.
 * 
 * @param scaleFactor {*} 1 / scale factor. 2 = downsample by 50%, 4 = downsample by 75%...
 */
function derez(srcCanvas, destCanvas, scaleFactor = 2) {
    let srcContext = srcCanvas.getContext("2d");

    // Ensure that the dimensions of the original are evenly divisible by the dimensions
    // of the scaled canvas. To do this, clip odd-sized images, ensuring that we discard 
    // roughly an even amount of each edge if necessary
    let clipWidth = srcCanvas.width - (srcCanvas.width % scaleFactor);
    let clipHeight = srcCanvas.height - (srcCanvas.height % scaleFactor);
    let offsetX = Math.floor((srcCanvas.width - clipWidth) / 2);
    let offsetY = Math.floor((srcCanvas.height - clipHeight) / 2);

    let srcImgData = srcContext.getImageData(offsetX, offsetY, clipWidth, clipHeight);
    let srcData = srcImgData.data;

    let scaledWidth = clipWidth / scaleFactor;
    let scaledHeight = clipHeight / scaleFactor;

    destCanvas.setAttribute("width", scaledWidth);
    destCanvas.setAttribute("height", scaledHeight);
    let destContext = destCanvas.getContext("2d");
    let destImgData = destContext.getImageData(0, 0, scaledWidth, scaledHeight);
    let destData = destImgData.data;
    
    // We currently have a simple box-sampling algorithm; good enough for now
    let srcLineStride = srcImgData.width * pixelStride;
    let destLineStride = destImgData.width * pixelStride;

    for (let sj = 0, dj = 0; sj < clipHeight; sj += scaleFactor, dj++) {
        let srcRowStart = sj * srcLineStride;

        for (let si = 0, di = 0; si < clipWidth; si += scaleFactor, di++) {
            let srcColumn = si * pixelStride;
            let r = 0, g = 0, b = 0, a = 0;

            // Sum all of the pixels in the box
            for (let y = 0; y < scaleFactor; y++) {
                let row = srcRowStart + (y * srcLineStride);
                for (let x = 0; x < scaleFactor; x++) {
                    let col = srcColumn + (x * pixelStride);
                    r += srcData[row + col    ];
                    g += srcData[row + col + 1];
                    b += srcData[row + col + 2];
                    a += srcData[row + col + 3];
                }
            }

            // Average the pixels in the box
            let numPixels = scaleFactor * scaleFactor;
            r = r / numPixels;
            g = g / numPixels;
            b = b / numPixels;
            a = a / numPixels;

            // Draw the averaged value into the output
            setPixel(destData, destLineStride, pixelStride, di, dj, [r, g, b, a]);
        }
    }
    destContext.putImageData(destImgData, 0, 0);
}

/**
 * Draw a scaled version of the source canvas into the destionation. Resizes the
 * destination to fit the scaled image.
 * 
 * @param {*} srcCanvas 
 * @param {*} destCanvas 
 * @param {*} scaleFactor Must be a positive integer
 */
function renderScaled(srcCanvas, destCanvas, scaleFactor) {
    let scaledWidth = srcCanvas.width * scaleFactor;
    let scaledHeight = srcCanvas.height * scaleFactor;

    let srcContext = srcCanvas.getContext("2d");
    let srcImgData = srcContext.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
    let srcData = srcImgData.data;

    // Resize output canvas to avoid artifacts on the bottom + right edges if the
    // output image is smaller than the original canvas size
    destCanvas.setAttribute("width", scaledWidth);
    destCanvas.setAttribute("height", scaledHeight);
    let destContext = destCanvas.getContext("2d");
    let destImgData = destContext.getImageData(0, 0, scaledWidth, scaledHeight);
    let destData = destImgData.data;

    let srcLineStride = srcImgData.width * pixelStride;
    let destLineStride = destImgData.width * pixelStride;

    let sourceRowStart, srcColStart, destRowStart, destColStart = 0;
    let r, g, b, a;

    // sj is row index of original; dj is row index of scaled image
    for (let sj = 0, dj = 0; sj < srcCanvas.height; sj++, dj += scaleFactor) {
        sourceRowStart = sj * srcLineStride;
        destRowStart = dj * destLineStride;

        // si is col index of original; di is col index of scaled image
        for (let si = 0, di = 0; si < srcCanvas.width; si++, di += scaleFactor) {
            srcColStart = si * pixelStride;
            destColStart = di * pixelStride;

            r = srcData[sourceRowStart + srcColStart    ];
            g = srcData[sourceRowStart + srcColStart + 1];
            b = srcData[sourceRowStart + srcColStart + 2];
            a = srcData[sourceRowStart + srcColStart + 3];

            // Draw the new value in each block of pixels
            for (let y = 0; y < scaleFactor; y++) {
                let row = destRowStart + (y * destLineStride);
                for (let x = 0; x < scaleFactor; x++) {
                    let col = destColStart + (x * pixelStride);
                    destData[row + col    ] = r;
                    destData[row + col + 1] = g;
                    destData[row + col + 2] = b;
                    destData[row + col + 3] = a;
                }
            }
        }
    }
    destContext.putImageData(destImgData, 0, 0,);
}

/**
 * Converts a number in mm to inches. Truncates to 1 decimal place
 * @param {*} dimension 
 */
function mmToIn(dimension) {
    return (dimension / 25.4).toString().match(/^-?\d+(?:\.\d{0,1})?/)[0];
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
    for (let n = 0; n < palette.length; n++) {
        palR = palette[n][0];
        palG = palette[n][1];
        palB = palette[n][2];
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
        if (dist = 0) {
            //alert("found exact color match!");
            break;
        }
    }
    return newColor;
}

/**
 * Return the r/g/b/a values of the pixel at the given location in the array of
 * RGBA pixel data
 * 
 * @param {*} pixelData 
 * @param {*} lineStride Number of array elements in a line
 * @param {*} pixelStride Number of array elements in a pixel
 * @param {*} x 
 * @param {*} y 
 */
function getPixel(pixelData, lineStride, pixelStride, x, y) {
    let r = pixelData[(y * lineStride) + (x * pixelStride)    ];
    let g = pixelData[(y * lineStride) + (x * pixelStride) + 1];
    let b = pixelData[(y * lineStride) + (x * pixelStride) + 2];
    let a = pixelData[(y * lineStride) + (x * pixelStride) + 3];
    return [r, g, b, a]
}

/**
 * Sets the value of the pixel at the given location in the array of
 * RGBA pixel data
 * 
 * @param {*} pixelData 
 * @param {*} lineStride Number of array elements in a line
 * @param {*} pixelStride Number of array elements in a pixel
 * @param {*} x 
 * @param {*} y 
 * @param {*} pixel 4-element array of RGBA color data to write
 */
function setPixel(pixelData, lineStride, pixelStride, x, y, pixel) {
    pixelData[(y * lineStride) + (x * pixelStride)    ] = pixel[0];
    pixelData[(y * lineStride) + (x * pixelStride) + 1] = pixel[1];
    pixelData[(y * lineStride) + (x * pixelStride) + 2] = pixel[2];
    pixelData[(y * lineStride) + (x * pixelStride) + 3] = pixel[3];
}


function sharpen(srcCanvas, destCanvas, factor) {
    let kernel = [
        [1/9, 1/9, 1/9],
        [1/9, 1/9, 1/9],
        [1/9, 1/9, 1/9],
    ];
    let srcContext = srcCanvas.getContext("2d");
    let srcImgData = srcContext.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
    let srcData = srcImgData.data;

    destCanvas.setAttribute("width", srcCanvas.width);
    destCanvas.setAttribute("height", srcCanvas.height);
    let destContext = destCanvas.getContext("2d");
    let destImgData = destContext.getImageData(0, 0, destCanvas.width, destCanvas.height);
    let destData = destImgData.data;

    let lineStride = srcCanvas.width * pixelStride;
    for (y = 1; y < srcCanvas.height - 1; y++) {
        for (x = 1; x < srcCanvas.width - 1; x++) {
            origPixel = getPixel(srcData, lineStride, pixelStride, x, y);
            let r=0, g=0, b=0, a=0;
            for (ky = -1; ky < 2; ky++) {
                for (kx = -1; kx < 2; kx++) {
                    //
                    pixel = getPixel(srcData, lineStride, pixelStride, (x+kx), (y+ky));
                    r += kernel[ky + 1][kx + 1] * pixel[0];
                    g += kernel[ky + 1][kx + 1] * pixel[1];
                    b += kernel[ky + 1][kx + 1] * pixel[2];
                    a += pixel[3];  // Ignore alpha for now
                }
            }
            newPixel = [
                origPixel[0] + ((origPixel[0] - r) * factor),
                origPixel[1] + ((origPixel[1] - g) * factor),
                origPixel[2] + ((origPixel[2] - b) * factor),
                origPixel[3],   // Ignore alpha for now
            ];
            setPixel(destData, lineStride, pixelStride, x, y, newPixel);
        }
    }
    destContext.putImageData(destImgData, 0, 0);
}


/**
 * Color-quantize the canvas's image with the given color palette. Dithers using
 * Floyd-Steinberg.
 */
function decolor(canvas, palette) {
    let context = canvas.getContext("2d");
    let imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    let data = imgData.data;

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
    let lineStride = imgData.width * pixelStride;
    for (let j = 0; j < imgData.height; j++) {
        for (let i = 0; i < imgData.width; i++) {
            let pixel = getPixel(data, lineStride, pixelStride, i, j);

            // Find the nearest color in the palette
            let nearest = findNearestColor(palette, pixel);

            // Draw the new value in each block of pixels
           setPixel(data, lineStride, pixelStride, i, j, nearest);
            
            // Calculate quantization error
            let errR = pixel[0] - nearest[0];
            let errG = pixel[1] - nearest[1];
            let errB = pixel[2] - nearest[2];
            let errA = pixel[3] - nearest[3];

            /* pixel[x + 1][y    ] := pixel[x + 1][y    ] + quant_error × 7 / 16 */
            if ((i+1) < imgData.width) {
                let tmpPixel = getPixel(data, lineStride, pixelStride, i+1, j);
                let tmpR = tmpPixel[0] + parseInt(errR * 7 / 16);
                let tmpG = tmpPixel[1] + parseInt(errG * 7 / 16);
                let tmpB = tmpPixel[2] + parseInt(errB * 7 / 16);
                let tmpA = tmpPixel[3] + parseInt(errA * 7 / 16);
                setPixel(data, lineStride, pixelStride, i+1, j, [tmpR, tmpG, tmpB, tmpA]);
            }

            /* pixel[x - 1][y + 1] := pixel[x - 1][y + 1] + quant_error × 3 / 16 */
            if (((i-1) >= 0) && ((j+1) < imgData.height)) {
                let tmpPixel = getPixel(data, lineStride, pixelStride, i-1, j+1);
                let tmpR = tmpPixel[0] + parseInt(errR * 3 / 16);
                let tmpG = tmpPixel[1] + parseInt(errG * 3 / 16);
                let tmpB = tmpPixel[2] + parseInt(errB * 3 / 16);
                let tmpA = tmpPixel[3] + parseInt(errA * 3 / 16);
                setPixel(data, lineStride, pixelStride, i-1, j+1, [tmpR, tmpG, tmpB, tmpA]);
            }

            /* pixel[x    ][y + 1] := pixel[x    ][y + 1] + quant_error × 5 / 16 */
            if ((j+1) < imgData.height) {
                let tmpPixel = getPixel(data, lineStride, pixelStride, i, j+1);
                let tmpR = tmpPixel[0] + parseInt(errR * 5 / 16);
                let tmpG = tmpPixel[1] + parseInt(errG * 5 / 16);
                let tmpB = tmpPixel[2] + parseInt(errB * 5 / 16);
                let tmpA = tmpPixel[3] + parseInt(errA * 5 / 16);
                setPixel(data, lineStride, pixelStride, i, j+1, [tmpR, tmpG, tmpB, tmpA]);
            }

            /* pixel[x + 1][y + 1] := pixel[x + 1][y + 1] + quant_error × 1 / 16 */
            if (((i+1) < imgData.width) && ((j+1) < imgData.height)) {
                let tmpPixel = getPixel(data, lineStride, pixelStride, i+1, j+1);
                let tmpR = tmpPixel[0] + parseInt(errR * 1 / 16);
                let tmpG = tmpPixel[1] + parseInt(errG * 1 / 16);
                let tmpB = tmpPixel[2] + parseInt(errB * 1 / 16);
                let tmpA = tmpPixel[3] + parseInt(errA * 1 / 16);
                setPixel(data, lineStride, pixelStride, i+1, j+1, [tmpR, tmpG, tmpB, tmpA]);
            }
        }
    }
    context.putImageData(imgData, 0, 0);
}
