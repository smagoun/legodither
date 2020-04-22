
class Palette {

    static getPalette() {
        return this.palette;
    }

    static getPaletteLinear() {
        if (this.paletteLinear === []) {
            for (i = 0; i < this.palette.length; i++) {
                this.paletteLinear[i] = srgbToLinear(this.palette[i]);
            }
        }
        return this.paletteLinear;
    }
}

Palette.palette = [];
Palette.paletteLinear = [];
