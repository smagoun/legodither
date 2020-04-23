
class PaletteWebSafeColor extends Palette {
    getPalette() {
        if (this.constructor.palette.length === 0) {
            for (let i = 0; i <= 0xFF; i+= 0x33) {
                for (let j = 0; j <= 0xFF; j+= 0x33) {
                    for (let k = 0; k <= 0xFF; k+= 0x33) {
                        this.constructor.palette.push([i, j, k]);
                    }
                }
            }
        }
        return super.getPalette();
    }
}

PaletteWebSafeColor.palette = [];
