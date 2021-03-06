
class Palette {

    /**
     * Creates a Palette using the provided ID, which can be used
     * later for identifying the palette.
     * 
     * @param {*} id 
     */
    constructor(id) {
        this.id = id;
        this.palette = [];
    }

    /**
     * Return the ID assigned to the palette.
     */
    getId() {
        return this.id;
    }

    /**
     * Return the color palette as an array. Each element
     * is a 2-element array of a color object and a boolean indicating
     * whether the color is enabled or disabled.
     */
    getPalette() {
        if (this.palette.length === 0) {
            this.palette = this.constructor.makePalette();
        }
        return this.palette;
    }

    /**
     * Toggles the color on/off at the given index into the palette
     * 
     * @param {number} index 
     */
    toggleColor(index) {
        if (this.palette.length >0) {
            this.palette[index][1] = !this.palette[index][1];
        }
    }

    /**
     * Generate a palette from the static array of color/colornames defined in
     * the static 'palette' property.
     * 
     * Override this to generate a custom palette.
     */
    static makePalette() {
        let ret = [];
        for (let tmp of this.palette) {
            let name = "";
            if (tmp.length >= 2) {
                name = tmp[1];
            } else {
                name = "" + tmp;
            }
            let color = new Color([tmp[0][0], tmp[0][1], tmp[0][2], 255], name);
            ret.push([color, true]);   // Colors are always enabled at first
        }
        return ret;
    }

    getPaletteLinear() {
        if (this.paletteLinear === []) {
            for (let i = 0; i < this.palette.length; i++) {
                this.paletteLinear[i] = srgbToLinear(this.palette[i]);
            }
        }
        return this.paletteLinear;
    }

    isColor() {
        return this.constructor.isColor;
    }

    /**
     * Look up the name of a color using its RGB values. Ignores alpha channel.
     * 
     * @param {*} rgba 
     */
    getColorName(rgba) {
        if (this.nameMap === undefined) {
            this.nameMap = new Map();
            for (const [palColor, ] of this.palette) {
                this.nameMap.set("" + palColor.getRGBA(), palColor.getName());
            }
        }
        let ret = this.nameMap.get("" + rgba);
        return (ret === undefined) ? rgba : ret;
    }
}

Palette.palette = [];
Palette.paletteLinear = [];
Palette.isColor = true;
