
class Palette4BitGray extends Palette {
    getPalette() {
        if (this.constructor.palette.length === 0) {
            for (i = 0; i < 256; i+= 17) {
                this.constructor.palette.push([i, i, i]);
            }
        }
        return super.getPalette();
    }
}

Palette4BitGray.palette = [];
Palette4BitGray.isColor = false;
