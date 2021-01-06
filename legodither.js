
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
 * Max width of the input in pixels. Value is arbitrary. Performance slows for larger values.
 */
const MAX_WIDTH = 500;

/**
 * Initial width of the mosaic, in pixels;
 */
const INIT_MOSAIC_WIDTH = 64;

/**
 * Initial width of the input canvas, in pixels;
 */
const INIT_IMG_WIDTH = 320;

/**
 * Load an image file for processing
 * 
 * @param {*} event 
 * @param {*} targetID id of the <img> element to hold the original
 */
function loadFile(event, targetID) {
    var targetImg = document.getElementById(targetID);
    targetImg.src = URL.createObjectURL(event.target.files[0]);
    targetImg.onload = function () {
        URL.revokeObjectURL(this.src); // free memory
        imageLoaded(this);
    };
};

/**
 * Callback when an image is loaded into an <img>
 * 
 * @param {*} targetImg <img> node containing an image to be turned into a mosaic
 */
function imageLoaded(targetImg) {
    let canvas = document.getElementById("originalCanvas");

    let width = targetImg.width < MAX_WIDTH ? targetImg.width : MAX_WIDTH;
    let height = targetImg.height * (width / targetImg.width);

    canvas.setAttribute("width", width);
    canvas.setAttribute("height", height);
    context = canvas.getContext("2d");
    context.drawImage(targetImg, 0, 0, targetImg.width, targetImg.height, 0, 0, width, height);
    updateSize(0, INIT_MOSAIC_WIDTH, 0);
    resetLevels();
    drawLego();
}


/**
 * Alternate entry point (cf. loadFile) draws an initial image into the canvas. 
 * 
 * Uses an emoji rather than an actual file to faciliate development without a server;
 * images loaded using file:// URLs are tainted and canvas...getImageData() will fail.
 */
function drawInitialImage() {
    let canvas = document.getElementById("originalCanvas");

    let width = INIT_IMG_WIDTH;
    let height = INIT_IMG_WIDTH;
    let str = "🐶"; // Dog face emoji, U+1F436
    
    canvas.setAttribute("width", width);
    canvas.setAttribute("height", height);
    context = canvas.getContext("2d");

    context.font = '256px Sans';
    context.textBaseline = "middle";
    context.textAlign = "center";

    // Center text vertically + horizontally
    let textX = width / 2;
    // Setting textY = (height / 2) is the obvious choice, but that
    // results in some emojis looking like they're too high in the frame
    // Monkey Face (🐵 / U+1F435) is one example
    let descent = context.measureText(str).fontBoundingBoxDescent;
    let textY = height - descent;

    context.fillRect(0, 0, width, height);
    context.fillText(str, textX, textY);

    updateSize(0, INIT_MOSAIC_WIDTH, 0);
    resetLevels();
    drawLego();
}

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
 * Wrapper for getPalette() that looks up palette name from the page.
 */
function getPaletteFromSelect() {
    let p = document.getElementById("paletteSelect");
    let paletteName = p.options[p.selectedIndex].value;
    return getPalette(paletteName);
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
    let func = resizeBox;
    switch (type) {
        case "box":             func = resizeBox;                break;
        case "nearestNeighbor": func = resizeNearestNeighbor;    break;
        case "bilinear":        func = resizeBilinear;           break;
        case "dpid":            func = resizeDetailPreserving;   break;
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
 * Wrapper for calculateDestSize() that updates the values in the 
 * scale/x/y input elements. 
 * 
 * @param {Number} factor 
 * @param {Number} width 
 * @param {Number} height 
 */
function updateSize(factor, width, height) {
    let srcCanvas = document.getElementById("originalCanvas");
    let {scaleFactor, destWidth, destHeight} = calculateDestSize(
        srcCanvas.width, srcCanvas.height, factor, width, height);
    console.log(`Calculated scale factor ${scaleFactor}, width: ${destWidth}, height: ${destHeight}`);
    document.getElementById("outputWidth").value = destWidth;
    document.getElementById("outputHeight").value = destHeight;
    document.getElementById("scaleInput").value = scaleFactor;
}

/**
 * Calculate destination image size + scale factor from the source image.
 * Exactly one of scaleFactor, destWidth, and destHeight should be non-zero;
 * this value will be used to calculate the other parameters.
 * 
 * @param {Number} srcWidth 
 * @param {Number} srcHeight 
 * @param {Number} scaleFactor 
 * @param {Number} destWidth 
 * @param {Number} destHeight 
 * @returns 3-tuple of calculated (scaleFactor, destWidth, destHeight)
 */
function calculateDestSize(srcWidth, srcHeight, scaleFactor, destWidth, destHeight) {
    console.assert((srcWidth !== 0 && srcHeight !== 0),
        `src dimensions must not be 0: ${srcWidth}x${srcHeight}`);
    console.assert(scaleFactor !== 0 || destWidth !== 0 || destHeight !== 0,
        `One of scaleFactor/destWidth/destHeight must be non-zero`);
    console.assert(
        (scaleFactor !== 0 && destWidth   === 0 && destHeight === 0) ||
        (destWidth   !== 0 && scaleFactor === 0 && destHeight === 0) ||
        (destHeight  !== 0 && scaleFactor === 0 && destWidth  === 0),
        `Exacly one of factor/destWidth/destHeight can be non-zero`);
    // TODO: getDestImage() used to clip the source image, do we have to do that??
    if (scaleFactor) {
        //clipWidth = srcWidth - (srcWidth % scaleFactor);
        //clipHeight = srcHeight - (srcHeight % scaleFactor);
        destWidth = Math.round(srcWidth / scaleFactor);
        destHeight = Math.round(srcHeight / scaleFactor);
    } else if (destWidth) {
        scaleFactor = srcWidth / destWidth;
        //clipHeight = srcHeight - (srcHeight % scaleFactor);
        destHeight = Math.round(srcHeight / scaleFactor);
    } else if (destHeight) {
        scaleFactor = srcHeight / destHeight;
        //clipWidth = srcWidth - (srcWidth % scaleFactor);
        destWidth = Math.round(srcWidth / scaleFactor);
    }
    return { scaleFactor, destWidth, destHeight };
}

/**
 * Read the source image and draw a lego-ized version of it into the lego canvas.
 * 
 * Uses a pair of additional canvases as scratch space. Swaps between them depending
 * on the operation; some operations run in-place and others copy from one canvas
 * to another.
 */
function drawLego(drawBOM = true) {
    let t0 = performance.now();
    let srcCanvas = document.getElementById("originalCanvas");
    let scratchACanvas = document.getElementById("scratchACanvas");
    let scratchBCanvas = document.getElementById("scratchBCanvas");
    setupScratch(scratchACanvas, scratchBCanvas);
    let outputCanvas = document.getElementById("legoCanvas");

    // Invariant: destination img w/h and scale factor are always synced
    let scaleFactor = Number(document.getElementById("scaleInput").value);
    let destWidth = Number(document.getElementById("outputWidth").value);
    let destHeight = Number(document.getElementById("outputHeight").value);

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

    let palette = getPaletteFromSelect();

    copyImage(srcCanvas, getCurrCanvas());

    // TODO: Should probably split the level adjustment into 2. Adjust input levels
    // before applying destructive transformations (convolutions, scaling), and
    // apply output levels on rendering
    preprocess(getCurrCanvas(), inputLevelsShadow, inputLevelsMidpoint, inputLevelsHighlight,
        outputLevelsShadow, outputLevelsHighlight, 
        brightnessAdjustment, saturationAdjustment, contrastAdjustment);

    // Downsample the image using the selected algorithm
    // TODO: What is the ideal blur before downsizing? Box filter already blurs;
    // we need the blur for nearest-neighbor (and others?)
    let r = document.getElementById("resizeSelect");
    let resizeFilterName = r.options[r.selectedIndex].value;
    let resizeFn = getResizingFilter(resizeFilterName);
    // Set output image size. Use curr/next vars to avoid accidental canvas-swapping
    let currCanvas = getCurrCanvas();
    let destCanvas = getNextCanvas();
    destCanvas.setAttribute("width", destWidth);
    destCanvas.setAttribute("height", destHeight);
    resizeWrapper(resizeFn, currCanvas, destCanvas);

    unsharpMask(getCurrCanvas(), getNextCanvas(), sharpenFactor);

    if (palette != null) {
        decolor(getCurrCanvas(), palette, ditherType);
    }
    renderScaled(getCurrCanvas(), outputCanvas, Math.round(scaleFactor));

    renderStats(srcCanvas.width, srcCanvas.height, 'orig');
    renderStats(destWidth, destHeight, 'lego');

    drawPalette(palette);

    if (drawBOM) {
        drawBricksAndBOM();
    }

    // Attach editor
    attachEditor(outputCanvas, Math.round(scaleFactor));

    drawPenColorChooser(palette);

    let t1 = performance.now();
    console.log("Total time: " + (t1 - t0) + "ms");
}

/**
 * Convenience wrapper to calculate the bill of materials, render it, 
 * and render the bricks. Looks up the current palette and algorithm
 * for producing the bill of materials from the page.
 */
function drawBricksAndBOM() {
    let bomAlgorithm = document.getElementById("findRectsSelect").value;
    let palette = getPaletteFromSelect();

    // Figure out bill of materials
    let img = ImageInfo.fromCanvas(getCurrCanvas());
    let {cost, bom} = calculateBOM(img, bomAlgorithm);
    renderBOM(cost, bom, palette);

    // Draw the bricks
    let instructionCanvas = document.getElementById("instructionCanvas");
    drawBricks(bom, instructionCanvas, img.width, img.height);
}

/**
 * Draw stats about the image. Uses the prefix to find the elements to render into.
 * 
 * @param {*} bricksX 
 * @param {*} bricksY 
 * @param {*} outputPrefix Prefix of the stats elements, such as 'lego' or 'orig'
 */
function renderStats(bricksX, bricksY, outputPrefix) {
    let locale = "en";  // TODO: get from browser
    document.getElementById(outputPrefix + 'WidthBricks').textContent   = Number(bricksX).toLocaleString(locale);
    document.getElementById(outputPrefix + 'HeightBricks').textContent  = Number(bricksY).toLocaleString(locale);
    document.getElementById(outputPrefix + 'TotalBricks').textContent   = Number(bricksX * bricksY).toLocaleString(locale);
    document.getElementById(outputPrefix + 'WidthMM').textContent       = Number(bricksX * brickWidth).toLocaleString(locale);
    document.getElementById(outputPrefix + 'HeightMM').textContent      = Number(bricksY * brickWidth).toLocaleString(locale);
    document.getElementById(outputPrefix + 'WidthInch').textContent     = Number(mmToIn(bricksX * brickWidth)).toLocaleString(locale);
    document.getElementById(outputPrefix + 'HeightInch').textContent    = Number(mmToIn(bricksY * brickWidth)).toLocaleString(locale);
}

/**
 * Toggles the color at the given index in the color palette
 * and redraw the image with the updated colors
 * 
 * @param {*} index 
 */
function toggleColor(index) {
    if (currPalette != null) {
        currPalette.toggleColor(index);
    }
    drawLego();
}

/**
 * Draws the color palette
 * 
 * @param {Palette} palette 
 */
function drawPalette(palette) {
    let outerDiv = document.getElementById("palette-wrapper");
    let paletteDiv = genPalette(palette, false, "palette-checkbox", null, toggleColor);
    outerDiv.replaceChild(paletteDiv, outerDiv.firstChild);
}

/**
 * Generate a color palette, with options to use checkboxes or radio
 * buttons to represent colors. Allows use as a palette or as a color picker.
 * 
 * @param {Palette} palette Palette of colors to be drawn
 * @param {Boolean} isRadio Create radio buttons for colors if true, otherwise checkboxes
 * @param {String} labelClass CSS class to apply to the input element for each color
 * @param {*} radioName Name to give radio input elements. Ignored for checkboxes
 * @param {*} onchangeFn Function to be called on a change event
 * @returns HTML div with the color palette
 */
function genPalette(palette, isRadio, labelClass, radioName, onchangeFn) {
    let newDiv = document.createElement("div");
    let type = isRadio ? "radio" : "checkbox";
    let checkedSet = false;
    if (palette != null) {
        let paletteList = palette.getPalette();
        for (let i = 0; i < paletteList.length; i++) {
            let color = paletteList[i][0];
            let rgb = color.getRGBA();
            let enabled = paletteList[i][1];
            // Wrap the checkbox in a label w/ an empty span. Hack to get custom
            // checkboxes in Safari
            let label = document.createElement("label");
            label.setAttribute("class", labelClass);
            if (color.getName() != undefined) {
                label.setAttribute("title", color.getName());
            }
            let span = document.createElement("span");
            span.setAttribute("style", "--checked-color: rgb(" + rgb[0] + ", "
                + rgb[1] + ", " + rgb[2] + ")");
            let elt = document.createElement("input");
            elt.setAttribute("type", type);
            let eltName = (isRadio) ? radioName : i;
            elt.setAttribute("name", eltName);
            elt.setAttribute("onchange", `${onchangeFn.name}(${i});`);
            elt.setAttribute("class", "hidden-checkbox");
            if (isRadio) {
                if (!enabled) {
                    elt.setAttribute("disabled", "true");
                } else if (!checkedSet) {
                    // Check the first enabled item
                    elt.setAttribute("checked", "true");
                    checkedSet = true;
                }
            } else {    // Checkbox
            if (enabled) {
                    elt.checked = true;
                }
            }
            label.appendChild(elt);
            label.appendChild(span);
            newDiv.appendChild(label);
        }
    }
    return newDiv;
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
        case "3x3gaussian":
            kernel = ["1/16", "2/16", "1/16", 
                      "2/16", "4/16", "2/16",
                      "1/16", "2/16", "1/16"];
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

/**
 * Reset the sharpen adjustment to the default.
 */
function resetSharpen() {
    document.getElementById("sharpenInput").value = 0.5;
}
