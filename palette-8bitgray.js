
class Palette8BitGray extends Palette {
    getPalette() {
        if (this.constructor.palette.length === 0) {
            for (i = 0; i < 256; i++) {
                this.constructor.palette.push([i, i, i]);
            }
        }
        return super.getPalette();
    }
}

Palette8BitGray.palette = [];
Palette8BitGray.isColor = false;
