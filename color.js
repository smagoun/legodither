
class Color {

    /**
     * @param {Array} rgb 3-element array of R,G,B representing the color
     * @param {*} name 
     */
    constructor(rgb, name) {
        this.rgb = rgb;
        this.name = name;
    }

    getRGB() {
        return this.rgb;
    }

    getName() {
        return this.name;
    }

    /**
     * Utility function to compare color values. Ignores alpha channel.
     * 
     * @param {Array} a RGB or RGBA color information
     * @param {Array} b RGB or RGBA color information
     */
    static sameColor(a, b) {
        return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
    }
}
