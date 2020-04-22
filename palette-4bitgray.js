
class Palette4BitGray extends Palette {
    static getPalette() {
        if (this.palette.length === 0) {
            for (i = 0; i < 256; i+= 17) {
                this.palette.push([i, i, i]);
            }
        }
        return super.getPalette();
    }
}

Palette4BitGray.palette = [];
