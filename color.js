
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
}
