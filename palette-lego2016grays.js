/**
 * Official LEGO 2016 palette from https://www.thebrickfan.com/wp-content/uploads/2016/05/LEGO-Color-Palette-2016.pdf
 * RGB values determined via OSX Digital Color Meter App
*/

class PaletteLEGO2016Grays extends Palette {

    static getPalette() {
        if (this.palette.length === 0) {
            this.palette = this.makePalette();
        }
        return super.getPalette();
    }

    static makePalette() {
        let palette = [];
        let radix = 10;
        let tmp;
        for (let i = 1; i < PaletteLEGO2016Grays.colors.length; i++) {  // 1-indexed to skip header row
            tmp = [parseInt(PaletteLEGO2016Grays.colors[i][2], radix), 
                    parseInt(PaletteLEGO2016Grays.colors[i][3], radix), 
                    parseInt(PaletteLEGO2016Grays.colors[i][4], radix)];
            palette.push(tmp);
        }
        //alert("Found " + palette.length + " colors in palette")
        return palette;
    }
}

PaletteLEGO2016Grays.colors = [
  ["LEGO No.","LEGO Color","R","G","B","isTransparent","isMetallic"  ],
  ["1"," White",244,244,244,0,0  ],
  ["194"," Med. Stone Grey",160,161,159,0,0  ],
  ["199"," Dark Stone Grey",101,103,101,0,0  ],
  ["26"," Black",0,0,0,0,0  ],
];
