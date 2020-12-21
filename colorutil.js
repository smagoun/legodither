/**
 * Replaces the RGB values in the pixel with hue (degrees in the range 0-360), saturation (range 0-1),
 * and lightness (range 0-1).
 * 
 * Side effect is that pixel is updated. Does not return a value
 * 
 * @param {*} pixel 
 */
function rgb2hsl(pixel) {
    let i_r = pixel[0];
    let i_g = pixel[1];
    let i_b = pixel[2];
    let r; let g; let b; let hue; let sat;

    // Calculate lightness using as much integer math as possible 
    // so that we can efficiently precalculate gamma without running into
    // tiny floating point differences
    let xmax = Math.max(Math.max(i_r, i_g), i_b);
    let xmin = Math.min(Math.min(i_r, i_g), i_b);
    let lightness = (xmax + xmin) / 510.0;  // 2 * 255.0

    let chroma = (xmax - xmin) / 255.0;
    if (chroma === 0) {
        hue = 0;
        sat = 0;
    } else {
        r = i_r / 255.0;
        g = i_g / 255.0;
        b = i_b / 255.0;
        sat = chroma / (1 - Math.abs((2 * lightness) - 1));
        switch (xmax) {
            case i_r:
                // The ternary at the end is to handle the case where hue is negative
                hue = ((g - b) / chroma) + (g < b ? 6 : 0);
                break;
            case i_g:
                hue = 2 + ((b - r ) / chroma);
                break;
            case i_b:
                hue = 4 + ((r - g) / chroma);
                break;
            default:
                debugger
        }
        hue = hue * 60; // Convert to degrees
    }
    pixel[0] = hue;
    pixel[1] = sat;
    pixel[2] = lightness;
}

/**
 * Converts hue [0-360 degrees], saturation [0-1], and lightness [0-1] pixel values to RGB.
 * 
 * Side effect: updates pixel in-place. No return value.
 * 
 * @param {*} hsl 
 */
function hsl2rgb(pixel) {
    let hue = pixel[0];
    let sat = pixel[1];
    let lightness = pixel[2];

    let c = (1 - Math.abs((2 * lightness) - 1)) * sat;
    let hh = hue / 60;
    let x = c * (1 - Math.abs((hh % 2) - 1));
    let r, g, b;
    hc = Math.ceil(hh);
    switch (hc) {
        case 0:
        case 1: r=c, g=x, b=0;   break;
        case 2: r=x, g=c, b=0;   break;
        case 3: r=0, g=c, b=x;   break;
        case 4: r=0, g=x, b=c;   break;
        case 5: r=x, g=0, b=c;   break;
        case 6: r=c, g=0, b=x;   break;
        default:
            console.log("hc isn't expected: " + hc + ": " + pixel[0], + ", " + pixel[1] + ", " + pixel[2]);
            r=0, g=0, b=0;
    }
    let m = lightness - (c / 2);
    // Add lightness
    pixel[0] = clamp(Math.round((r + m) * 255));
    pixel[1] = clamp(Math.round((g + m) * 255)); 
    pixel[2] = clamp(Math.round((b + m) * 255));
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
