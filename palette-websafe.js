
class PaletteWebSafeColor extends Palette {
    static getPalette() {
        if (this.palette.length === 0) {
            for (let i = 0; i <= 0xFF; i+= 0x33) {
                for (let j = 0; j <= 0xFF; j+= 0x33) {
                    for (let k = 0; k <= 0xFF; k+= 0x33) {
                        this.palette.push([i, j, k]);
                    }
                }
            }
        }
        return super.getPalette();
    }
}

PaletteWebSafeColor.palette = [];
