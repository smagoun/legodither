/*
 * Editing functionality. Allows the user to draw in the 'scaled'
 * canvas, which is bigger + easier to see/maniuplate. Since
 * the 'scratch' canvas is the master copy of the image,
 * translates edits from the scaled canvas to the master
 * and makes the changes there.
 *
 * TODO:
 *      Need to figure out whether/how to make edits persistent.
 *      Right now they'll disappear as soon as we make upstream adjustments.            
 *      Maybe a 'lock' feature to prevent inadvertent errors?
 *      Also consider implementing something akin to layers
 */

/**
 * Global state to track whether the user is currently drawing or not.
 */
let isDrawing = false;

/**
 * Current color to use for manual editing.
 */
let penColor = [255, 0, 0, 255];    // Iniital value is arbitrary

/**
 * Sets the pen color to the color at the given index in the color palette
 * 
 * @param {*} index 
 */
function setPenColor(index) {
    if (currPalette != null) {
        penColor = currPalette.getPalette()[index][0].getRGBA();
    }
}

/**
 * Add callbacks to the canvas to enable editing functions.
 * 
 * Note: The user is editing the scaled-up image produced by renderScaled(), whose
 * size is an integer multiple of the scaled-down image. This is not necessarily
 * the same scale factor used to create the scaled-down image.
 * 
 * @param {*} outputCanvas 
 * @param {*} scaleFactor Scale factor of the scaled-up image relative to the scaled-down image
 */
function attachEditor(outputCanvas, scaleFactor) {
    // mousedown handler
    if (outputCanvas.mouseDownCB != undefined) {
        outputCanvas.removeEventListener("mousedown", mouseDownCallback);
    }
    outputCanvas.addEventListener("mousedown", mouseDownCallback = function (e) {
        handleMouseDown(e, this, scaleFactor);
    });
    outputCanvas.mouseDownCB = mouseDownCallback;

    // mousemove handler
    if (outputCanvas.mouseOverCB != undefined) {
        outputCanvas.removeEventListener("mousemove", mouseMoveCallback);
    }
    outputCanvas.addEventListener("mousemove", mouseMoveCallback = function (e) {
        handleMouseMove(e, this, scaleFactor);
    });
    outputCanvas.mouseOverCB = mouseMoveCallback;

    // mouseup handler
    if (outputCanvas.mouseUpCB != undefined) {
        outputCanvas.removeEventListener("mouseup", mouseUpCallback);
    }
    outputCanvas.addEventListener("mouseup", mouseUpCallback = function (e) {
        handleMouseUp(e);
    });
    outputCanvas.mouseUpCB = mouseUpCallback;
}

/**
 * Begin drawing, and keep drawing while the user has the mouse down. Initiates a
 * flood fill if the shift key is pressed; otherwise starts drawing individual pixels.
 * 
 * @param {*} event 
 * @param {*} canvas 
 * @param {*} scaleFactor Scale factor of the scaled-up image relative to the scaled-down image
 */
function handleMouseDown(event, canvas, scaleFactor) {
    if (event.shiftKey) {
        floodFill(event, canvas, scaleFactor);
    } else {
        isDrawing = true;
        editPixel(event, canvas, scaleFactor);
    }
}

/**
 * If the mouse is down, draw on the canvas
 * 
 * @param {*} event 
 * @param {*} canvas 
 * @param {*} scaleFactor Scale factor of the scaled-up image relative to the scaled-down image
 */
function handleMouseMove(event, canvas, scaleFactor) {
    const [brickX, brickY] = getBrickCoords(event, scaleFactor);
    document.getElementById("outputXCoord").textContent = event.offsetX;
    document.getElementById("outputYCoord").textContent = event.offsetY;
    document.getElementById("outputBrickCoords").textContent = `${brickX},${brickY}`;
    if (isDrawing) {
        editPixel(event, canvas, scaleFactor);
    }
}

/**
 * Stops drawing and updates the bill of materials + rendered bricks
 * 
 * @param {*} event 
 */
function handleMouseUp(event) {
    isDrawing = false;
    drawBricksAndBOM();
}

/**
 * Draws a pixel on the canvas at the coordinates provided by the event.
 * 
 * @param {*} event 
 * @param {*} canvas 
 * @param {*} scaleFactor Scale factor of the scaled-up image relative to the scaled-down image
 */
function editPixel(event, canvas, scaleFactor) {
    // TODO: This is a candidate for optimization since it rerenders the entire
    // scaled image. Might be faster to manually draw the new color in the scaled
    // image (and avoid the putImageData call)
    const [brickX, brickY] = getBrickCoords(event, scaleFactor);
    let img = ImageInfo.fromCanvas(getCurrCanvas());
    img.setPixel(brickX, brickY, penColor);
    let ctx = getCurrCanvas().getContext("2d");
    ctx.putImageData(img.imageData, 0, 0);
    renderScaled(getCurrCanvas(), canvas, Math.round(scaleFactor));
}

/**
 * Return the x/y coordinates of the event, scaled down by the
 * given scaleFactor. For example, returns 1,3 for an event at 3,9 
 * and a scale factor of 3.  
 * 
 * @param {*} event 
 * @param {*} scaleFactor 
 */
function getBrickCoords(event, scaleFactor) {
    let pixelX = Math.floor(event.offsetX / scaleFactor);
    let pixelY = Math.floor(event.offsetY / scaleFactor);
    return [pixelX, pixelY];
}

/**
 * Draws the widget for choosing pen color and selects the first enabled color
 * in the palette as the current pen color.
 * 
 * @param {Palette} palette 
 */
function drawPenColorChooser(palette) {
    let outerDiv = document.getElementById("pencolor-wrapper");
    let paletteDiv = genPalette(palette, true, "pencolor-radio", "pencolor", setPenColor);
    paletteDiv.setAttribute("class", "pencolor-palette");
    let firstChecked = paletteDiv.querySelector("input[checked]");
    firstChecked.onchange();
    outerDiv.replaceChild(paletteDiv, outerDiv.firstChild);
}

/**
 * Flood-fill the image starting at the point under the mouse cursor.
 * Uses the current penColor as the fill color.
 * 
 * @param {*} event 
 * @param {*} canvas 
 * @param {*} scaleFactor Scale factor of the scaled-up image relative to the scaled-down image
 */
function floodFill(event, canvas, scaleFactor) {
    const [brickX, brickY] = getBrickCoords(event, scaleFactor);
    let img = ImageInfo.fromCanvas(getCurrCanvas());
    let oldColor = [0, 0, 0, 0];
    img.getPixel(brickX, brickY, oldColor);
    flood(img, brickX, brickY, oldColor, penColor);
    let ctx = getCurrCanvas().getContext("2d");
    ctx.putImageData(img.imageData, 0, 0);
    renderScaled(getCurrCanvas(), canvas, Math.round(scaleFactor));
}

/**
 * Recursive function to recolor all contiguous pixels that match
 * the given 'oldColor'
 * 
 * @param {*} img 
 * @param {*} x 
 * @param {*} y 
 * @param {*} oldColor Color to match
 * @param {*} newColor New color to paint
 */
function flood(img, x, y, oldColor, newColor) {
    if (x < 0 || x >= img.width || y < 0 || y >= img.height) {
        return;
    } else {
        let tmpColor = [0, 0, 0, 0];
        img.getPixel(x, y, tmpColor);
        if (Color.sameColor(oldColor, tmpColor)) {
            img.setPixel(x, y, newColor);
            flood(img, x+1, y, oldColor, newColor);
            flood(img, x-1, y, oldColor, newColor);
            flood(img, x, y-1, oldColor, newColor);
            flood(img, x, y+1, oldColor, newColor);
        }
    }
}
