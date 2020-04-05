
class Palette4BitGray {
    static getPalette() {
        let palette = [];
        for (i = 0; i < 256; i+= 17) {
            palette.push([i, i, i]);
        }
        return palette;
    }
}