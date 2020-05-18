
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
    if (currPalette != null && paletteName === currPalette.getId()) {
        return currPalette;
    }
    switch (paletteName) {
        case "native":          currPalette = null;                                     break;
        case "lego2016":        currPalette = new PaletteLEGO2016(paletteName);         break;
        case "lego2016grays":   currPalette = new PaletteLEGO2016Grays(paletteName);    break;
        case "legoPABplates":   currPalette = new PaletteLEGOPABPlates(paletteName);    break;
        case "legoPABbricks":   currPalette = new PaletteLEGOPABBricks(paletteName);    break;
        case "peeron":          currPalette = new PalettePeeron(paletteName);           break;
        case "mono":            currPalette = new PaletteMono(paletteName);             break;
        case "3bitcolor":       currPalette = new Palette3BitColor(paletteName);        break;
        case "2bitgray":        currPalette = new Palette2BitGray(paletteName);         break;
        case "4bitgray":        currPalette = new Palette4BitGray(paletteName);         break;
        case "8bitgray":        currPalette = new Palette8BitGray(paletteName);         break;
        case "4bitcolormac":    currPalette = new Palette4BitColorMac(paletteName);     break;
        case "websafe":         currPalette = new PaletteWebSafeColor(paletteName);     break;
        default:
            alert("Couldn't find palette " + paletteName);
    }
    return currPalette;
}

/**
 * Current palette
 */
var currPalette = null;

/**
 * Return a resizing filter function.
 * 
 * @param {*} type 
 */
function getResizingFilter(type) {
    let func = derezBox;
    switch (type) {
        case "box":             func = derezBox;                break;
        case "nearestNeighbor": func = derezNearestNeighbor;    break;
        case "bilinear":        func = derezBilinear;           break;
        default:
            alert("Unknown resizing filter " + type);
    }
    return func;
}

/**
 * Scratch for canvas-swapping routine
 */
var currCanvas;
/**
 * Scratch for canvas-swapping routine
 */
var nextCanvas;
/**
 * Initialize the canvas-swapping routine
 * 
 * @param {*} scratchACanvas 
 * @param {*} scratchBCanvas 
 */
function setupScratch(scratchACanvas, scratchBCanvas) {
    currCanvas = scratchACanvas;
    nextCanvas = scratchBCanvas;
}
/**
 * Returns the currently-active scratch canvas
 */
function getCurrCanvas() {
    return currCanvas;
}
/**
 * Returns the next scratch canvas, effectively
 * swapping current + next
 */
function getNextCanvas() {
    let tmp = currCanvas;
    currCanvas = nextCanvas;
    nextCanvas = tmp;
    return currCanvas;
}

/**
 * Read the source image and draw a lego-ized version of it into the lego canvas.
 * 
 * Uses a pair of additional canvases as scratch space. Swaps between them depending
 * on the operation; some operations run in-place and others copy from one canvas
 * to another.
 */
function drawLego() {
    let t0 = performance.now();
    let srcCanvas = document.getElementById("originalCanvas");
    let scratchACanvas = document.getElementById("scratchACanvas");
    let scratchBCanvas = document.getElementById("scratchBCanvas");
    setupScratch(scratchACanvas, scratchBCanvas);
    let outputCanvas = document.getElementById("legoCanvas");

    let scaleFactor = Number(document.getElementById("scaleInput").value);
    let sharpenFactor = Number(document.getElementById("sharpenInput").value);

    let ditherType = document.getElementById("ditheringSelect").value;

    let inputLevelsShadow = parseFloat(document.getElementById("inputLevelsShadowInput").value);
    let inputLevelsMidpoint = parseFloat(document.getElementById("inputLevelsMidpointInput").value);
    let inputLevelsHighlight = parseFloat(document.getElementById("inputLevelsHighlightInput").value);
    let outputLevelsShadow = parseFloat(document.getElementById("outputLevelsShadowInput").value);
    let outputLevelsHighlight = parseFloat(document.getElementById("outputLevelsHighlightInput").value);

    let brightnessAdjustment = Number(document.getElementById("brightnessInput").value);
    let saturationAdjustment = parseFloat(document.getElementById("saturationInput").value);
    let contrastAdjustment = Number(document.getElementById("contrastInput").value);

    let p = document.getElementById("paletteSelect");
    let paletteName = p.options[p.selectedIndex].value;
    let palette = getPalette(paletteName);

    let bomAlgorithm = document.getElementById("findRectsSelect").value;

    copyImage(srcCanvas, getCurrCanvas());

    // TODO: Should probably split the level adjustment into 2. Adjust input levels
    // before applying destructive transformations (convolutions, scaling), and
    // apply output levels on rendering
    adjustLevels(getCurrCanvas(), inputLevelsShadow, inputLevelsMidpoint, inputLevelsHighlight, outputLevelsShadow, outputLevelsHighlight);

    brightness(getCurrCanvas(), brightnessAdjustment);
    saturate(getCurrCanvas(), saturationAdjustment);
    contrast(getCurrCanvas(), contrastAdjustment);

    // Downsample the image using the selected algorithm
    // TODO: What is the ideal blur before downsizing? Box filter already blurs;
    // we need the blur for nearest-neighbor (and others?)
    let r = document.getElementById("resizeSelect");
    let resizeFilterName = r.options[r.selectedIndex].value;
    let resize = getResizingFilter(resizeFilterName);
    resize(getCurrCanvas(), getNextCanvas(), scaleFactor);

    unsharpMask(getCurrCanvas(), getNextCanvas(), sharpenFactor);

    if (palette != null) {
        decolor(getCurrCanvas(), palette, ditherType);
    }
    renderScaled(getCurrCanvas(), outputCanvas, Math.round(scaleFactor));

    renderStats(srcCanvas.width, srcCanvas.height, 'orig');

    // Calculate the size of the lego canvas by using the same clipping/scaling
    // rules as in the derez function
    let clipWidth = srcCanvas.width - (srcCanvas.width % scaleFactor);
    let clipHeight = srcCanvas.height - (srcCanvas.height % scaleFactor);
    let bricksX = Math.round(clipWidth / scaleFactor);
    let bricksY = Math.round(clipHeight / scaleFactor);
    renderStats(bricksX, bricksY, 'lego');

    drawPalette(palette);

    // Figure out bill of materials
    let img = ImageInfo.fromCanvas(getCurrCanvas());
    let {cost, bom} = calculateBOM(img, bomAlgorithm);
    renderBOM(cost, bom, palette);
    let t1 = performance.now();
    console.log("Total time: " + (t1 - t0) + "ms");
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
 * Toggles the color at the given index in the color palette
 * 
 * @param {*} index 
 */
function toggleColor(index) {
    if (currPalette != null) {
        currPalette.toggleColor(index);
    }
}

/**
 * Draws the color palette
 * 
 * @param {Palette} palette 
 */
function drawPalette(palette) {
    let displayWidth = 8;
    let tableDiv = document.getElementById("paletteDisplay");
    let newTable = document.createElement("table");
    let body = newTable.createTBody();
    let row, cell;
    if (palette != null) {
        let paletteList = palette.getPalette();
        for (let i = 0; i < paletteList.length; i++) {
            if (i % displayWidth === 0) {
                row = body.insertRow();
            }
            let color = paletteList[i][0];
            let rgb = color.getRGBA();
            let enabled = paletteList[i][1];
            cell = row.insertCell();
            // Wrap the checkbox in a label w/ an empty span. Hack to get custom
            // checkboxes in Safari
            let label = document.createElement("label");
            label.setAttribute("class", "palette-checkbox");
            if (color.getName() != undefined) {
                label.setAttribute("title", color.getName());
            }
            let span = document.createElement("span");
            span.setAttribute("style", "--checked-color: rgb(" + rgb[0] + ", "
                + rgb[1] + ", " + rgb[2] + ")");
            let cb = document.createElement("input");
            cb.setAttribute("type", "checkbox");
            cb.setAttribute("name", i);
            cb.setAttribute("onchange", "toggleColor(" + i + "); drawLego();");
            cb.setAttribute("class", "hidden-checkbox");
            if (enabled) {
                cb.checked = true;
            }
            label.appendChild(cb);
            label.appendChild(span);
            cell.appendChild(label);
        }
    }
    tableDiv.replaceChild(newTable, tableDiv.firstChild);
}

/**
 * Enable all colors in the palette
 */
function enableAllColors() {
    if (currPalette != null) {
        let paletteList = currPalette.getPalette();
        for (let i = 0; i < paletteList.length; i++) {
            paletteList[i][1] = true;
        }
    }
    drawLego();
}

/**
 * Copies an image from one canvas to another.
 * 
 * @param {*} srcCanvas 
 * @param {*} destCanvas 
 */
function copyImage(srcCanvas, destCanvas) {
    let srcContext = srcCanvas.getContext("2d");
    let destContext = destCanvas.getContext("2d");
    destCanvas.setAttribute("width", srcCanvas.width);
    destCanvas.setAttribute("height", srcCanvas.height);
    destContext.putImageData(srcContext.getImageData(0, 0, srcCanvas.width, srcCanvas.height), 0, 0);
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

    let pixel = [0, 0, 0, 0];
    // sj is row index of original; dj is row index of scaled image
    for (let sj = 0, dj = 0; sj < srcImg.height; sj++, dj += scaleFactor) {
        // si is col index of original; di is col index of scaled image
        for (let si = 0, di = 0; si < srcImg.width; si++, di += scaleFactor) {
            srcImg.getPixel(si, sj, pixel);

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
 * Reset the brightness adjustment to the default.
 */
function resetBrightness() {
    document.getElementById("brightnessInput").value = 0;
}

/**
 * Reset the saturation adjustment to the default.
 */
function resetSaturation() {
    document.getElementById("saturationInput").value = 1.0;
}

/**
 * Reset the contrast adjustment to the default.
 */
function resetContrast() {
    document.getElementById("contrastInput").value = 0;
}
