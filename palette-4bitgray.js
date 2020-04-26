
class Palette4BitGray extends Palette {

    static makePalette() {
        let ret = [];
        for (i = 0; i < 256; i+= 17) {
            ret.push([new Color([i, i, i]), true]);   // Colors are always enabled at first
        }
        return ret;
    }
}

Palette4BitGray.palette = [];
Palette4BitGray.isColor = false;
