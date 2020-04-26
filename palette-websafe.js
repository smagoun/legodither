
class PaletteWebSafeColor extends Palette {

    static makePalette() {
        let ret = [];
        for (let i = 0; i <= 0xFF; i+= 0x33) {
            for (let j = 0; j <= 0xFF; j+= 0x33) {
                for (let k = 0; k <= 0xFF; k+= 0x33) {
                    ret.push([new Color([i, j, k]), true]);   // Colors are always enabled at first
                }
            }
        }
        return ret;
    }
}

PaletteWebSafeColor.palette = [];
