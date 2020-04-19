/**
 * Class that encapsulates data about an image and provides pixel-manipulation
 * functions.
 */
class ImageInfo {

    constructor(width, height, lineStride, pixelStride, imageData) {
        this.width = width;
        this.height = height;
        this.lineStride = lineStride;
        this.pixelStride = pixelStride;
        this.imageData = imageData;
        this.data = imageData.data;
    }

    /**
     * Return the r/g/b/a values of the pixel at the given location in the array of
     * RGBA pixel data
     * 
     * @param {*} x 
     * @param {*} y 
     */
    getPixel(x, y) {
        let r = this.data[(y * this.lineStride) + (x * this.pixelStride)    ];
        let g = this.data[(y * this.lineStride) + (x * this.pixelStride) + 1];
        let b = this.data[(y * this.lineStride) + (x * this.pixelStride) + 2];
        let a = this.data[(y * this.lineStride) + (x * this.pixelStride) + 3];
        return [r, g, b, a];
    }

    /**
     * Sets the value of the pixel at the given location in the array of
     * RGBA pixel data. Clamps values to the range 0-255.
     * 
     * @param {*} x 
     * @param {*} y 
     * @param {*} pixel 4-element array of RGBA color data to write
     */
    setPixel(x, y, pixel) {
        this.data[(y * this.lineStride) + (x * this.pixelStride)    ] = clamp(pixel[0]);
        this.data[(y * this.lineStride) + (x * this.pixelStride) + 1] = clamp(pixel[1]);
        this.data[(y * this.lineStride) + (x * this.pixelStride) + 2] = clamp(pixel[2]);
        this.data[(y * this.lineStride) + (x * this.pixelStride) + 3] = clamp(pixel[3]);
    }

    /**
     * Builds an ImageInfo from the contents of the canvas
     * 
     * @param {*} canvas 
     */
    static fromCanvas(canvas) {
        let context = canvas.getContext("2d");
        let imgData = context.getImageData(0, 0, canvas.width, canvas.height);
        let ret = new ImageInfo(canvas.width, canvas.height, canvas.width * pixelStride, 
            pixelStride, imgData);
        return ret;
    }
 }
