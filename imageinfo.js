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
     * Write the r/g/b/a values of the pixel at (x, y) into the given array.
     * No return value; side effect is that the array is modified.
     * 
     * @param {*} x 
     * @param {*} y 
     * @param {Array} pixel 4-element array to write into
     */
    getPixel(x, y, pixel) {
        let xy = (y * this.lineStride) + (x * this.pixelStride);
        pixel[0] = this.data[xy    ];
        pixel[1] = this.data[xy + 1];
        pixel[2] = this.data[xy + 2];
        pixel[3] = this.data[xy + 3];
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
        let xy = (y * this.lineStride) + (x * this.pixelStride);
        this.data[xy    ] = clamp(pixel[0]);
        this.data[xy + 1] = clamp(pixel[1]);
        this.data[xy + 2] = clamp(pixel[2]);
        this.data[xy + 3] = clamp(pixel[3]);
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
