/**
 * Given an RGB input color, find the nearest color from the given palette
 * and write it into the output color. Ignores the alpha channel.
 * 
 * Finds the nearest color using euclidean distance:
 * sqrt((r1 - r2)^2 + (g1 - g2)^2 + (b1 - b2)^2)
 * 
 * @param {*} palette 
 * @param {*} input 4-element array of RGBA
 * @param {*} output 4-element array of RGBA
 */
function findNearestColor(palette, input, output) {
    let r = input[0];
    let g = input[1]; 
    let b = input[2];
    output[0] = r;
    output[1] = g;
    output[2] = b;
    output[3] = input[3];

    let palR, palG, palB;

    let distance = Infinity;
    let dist;
    let paletteList = palette.getPalette();
    let pal;
    for (let n = 0; n < paletteList.length; n++) {
        if (!paletteList[n][1]) {   // Ignore palette colors that have been disabled
            continue;
        }
        pal = paletteList[n][0].getRGBA();
        palR = pal[0];
        palG = pal[1];
        palB = pal[2];
        // We don't care about the actual distance, just the relative distance,
        // so we can avoid an expensive sqrt()
        dist = ((r - palR) * (r - palR))
            + ((g - palG) * (g - palG))
            + ((b - palB) * (b - palB));
        if (dist < distance) {
            distance = dist;
            output[0] = palR;
            output[1] = palG;
            output[2] = palB;
        }
        if (dist === 0) {
            //alert("found exact color match!");
            break;
        }
    }
}

/**
 * Color-quantize the canvas's image with the given color palette. Dithers using
 * Floyd-Steinberg.
 * 
 * @param {*} canvas
 * @param {*} palette
 * @param {*} ditherType Dithering algorithm to apply: floyd-steinberg, ordered, or none 
 */
function decolor(canvas, palette, ditherType = "none") {
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
    let pixel = [0, 0, 0, 0];
    let nearest = [0, 0, 0, 0];
    let tmpPixel = [0, 0, 0, 0];
    let errR, errG, errB, errA;

    // Weights for ordered dithering
    let map = [
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5]
    ];
    // Ordered dither: since we're going to calculate an offset to add to the pixel,
    // recenter and scale the map to the range [-1, 1]. Recentering allows
    // the offset to darken the pixel. Scale since we'll multiply
    // by 255 later on to scale up to the range 0-255.
    // Subtracting 0.5 takes care of the centering
    map = map.map(y =>
        y.map(x => (x + 0.5) / (map.length * map.length) - 0.5)
    );
    let bits = Math.floor(Math.log2(palette.getPalette().length)); 
    let r = 255 / bits;

    for (let j = 0; j < img.height; j++) {
        for (let i = 0; i < img.width; i++) {
            img.getPixel(i, j, pixel);

            if (!palette.isColor()) {
                // Special case for grayscale: convert to perceptual grayscale
                // Algorithm from http://entropymine.com/imageworsener/grayscale/
                let gray = ((0.2126 * (pixel[0] ** 2.2)) + (0.7152 * (pixel[1] ** 2.2))
                    + (0.0722 * (pixel[2] ** 2.2))) ** (1/2.2);
                pixel = [gray, gray, gray, pixel[3]];
            }
            
            if (ditherType === "ordered") {
                let threshold = map[j % map.length][i % map.length];
                let offset = r * threshold;
                pixel[0] = pixel[0] + offset; 
                pixel[1] = pixel[1] + offset;
                pixel[2] = pixel[2] + offset;
            }

            // Find the nearest color in the palette
            findNearestColor(palette, pixel, nearest);

            // Draw the new value in each block of pixels
            img.setPixel(i, j, nearest);

            if (ditherType === "floyd-steinberg") {
                // Calculate quantization error
                errR = (pixel[0] - nearest[0]) / 16;
                errG = (pixel[1] - nearest[1]) / 16;
                errB = (pixel[2] - nearest[2]) / 16;

                /* pixel[x + 1][y    ] := pixel[x + 1][y    ] + quant_error × 7 / 16 */
                if ((i+1) < img.width) {
                    img.getPixel(i+1, j, tmpPixel);
                    tmpPixel[0] = tmpPixel[0] + Math.round(errR * 7);
                    tmpPixel[1] = tmpPixel[1] + Math.round(errG * 7);
                    tmpPixel[2] = tmpPixel[2] + Math.round(errB * 7);
                    img.setPixel(i+1, j, tmpPixel);
                }

                /* pixel[x - 1][y + 1] := pixel[x - 1][y + 1] + quant_error × 3 / 16 */
                if (((i-1) >= 0) && ((j+1) < img.height)) {
                    img.getPixel(i-1, j+1, tmpPixel);
                    tmpPixel[0] = tmpPixel[0] + Math.round(errR * 3);
                    tmpPixel[1] = tmpPixel[1] + Math.round(errG * 3);
                    tmpPixel[2] = tmpPixel[2] + Math.round(errB * 3);
                    img.setPixel(i-1, j+1, tmpPixel);
                }

                /* pixel[x    ][y + 1] := pixel[x    ][y + 1] + quant_error × 5 / 16 */
                if ((j+1) < img.height) {
                    img.getPixel(i, j+1, tmpPixel);
                    tmpPixel[0] = tmpPixel[0] + Math.round(errR * 5);
                    tmpPixel[1] = tmpPixel[1] + Math.round(errG * 5);
                    tmpPixel[2] = tmpPixel[2] + Math.round(errB * 5);
                    img.setPixel(i, j+1, tmpPixel);
                }

                /* pixel[x + 1][y + 1] := pixel[x + 1][y + 1] + quant_error × 1 / 16 */
                if (((i+1) < img.width) && ((j+1) < img.height)) {
                    img.getPixel(i+1, j+1, tmpPixel);
                    tmpPixel[0] = tmpPixel[0] + Math.round(errR);
                    tmpPixel[1] = tmpPixel[1] + Math.round(errG);
                    tmpPixel[2] = tmpPixel[2] + Math.round(errB);
                    img.setPixel(i+1, j+1, tmpPixel);
                }
            }
        }
    }
    let context = canvas.getContext("2d");
    context.putImageData(img.imageData, 0, 0);
}
