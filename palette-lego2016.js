/**
 * Official LEGO 2016 palette from https://www.thebrickfan.com/wp-content/uploads/2016/05/LEGO-Color-Palette-2016.pdf
 * RGB values determined via OSX Digital Color Meter App
 */
class PaletteLEGO2016 extends Palette {

    static makePalette() {
        let palette = [];
        let radix = 10;
        let rgb, name, color;
        for (let i = 1; i < this.colors.length; i++) {  // 1-indexed to skip header row
            if ((this.colors[i][5] == 1) || (this.colors[i][6] == 1)) {
                // Skip transparent + metallic colors
                continue;
            }
            name = this.colors[i][1];
            rgb = [parseInt(this.colors[i][2], radix), 
                    parseInt(this.colors[i][3], radix), 
                    parseInt(this.colors[i][4], radix)];
            color = new Color(rgb, name);
            palette.push([color, true]);   // Colors are always enabled at first
        }
        //alert("Found " + palette.length + " colors in palette")
        return palette;
    }
}

PaletteLEGO2016.colors = [
  ["LEGO No.","LEGO Color","R","G","B","isTransparent","isMetallic"  ],
  ["24"," Bright Yellow",248,206,71,0,0  ],
  ["106"," Bright Orange",230,131,59,0,0  ],
  ["21"," Bright Red",203,51,46,0,0  ],
  ["221"," Bright Purple",217,103,160,0,0  ],
  ["23"," Bright Blue",43,108,177,0,0  ],
  ["321"," Dark Azur",70,162,213,0,0  ],
  ["326","Spr. Yellowish Green",208,224,159,0,0  ],
  ["37"," Bright Green",78,172,88,0,0  ],
  ["119"," Bright Yel. Green",164,200,84,0,0  ],
  ["192"," Reddish Brown",98,49,27,0,0  ],
  ["18"," Nougat",211,142,103,0,0  ],
  ["1"," White",244,244,244,0,0  ],
  ["329"," White Glow",231,236,210,1,0  ],
  ["226"," Cool Yellow",254,244,139,0,0  ],
  ["222"," Light Purple",235,176,204,0,0  ],
  ["324"," Med. Lavender",145,119,176,0,0  ],
  ["102"," Medium Blue",94,157,202,0,0  ],
  ["322"," Medium Azur",84,187,208,0,0  ],
  ["323"," Aqua",200,227,218,0,0  ],
  ["5"," Brick Yellow",217,196,149,0,0  ],
  ["283"," Light Nougat",244,197,163,0,0  ],
  ["191"," Flame Yel. Orange",240,173,66,0,0  ],
  ["124"," Bright Red Violet",166,47,122,0,0  ],
  ["325"," Lavender",184,167,205,0,0  ],
  ["212"," Light Royal Blue",135,190,230,0,0  ],
  ["151"," Sand Green",119,147,124,0,0  ],
  ["138"," Sand Yellow",145,126,99,0,0  ],
  ["194"," Med. Stone Grey",160,161,159,0,0  ],
  ["316"," Titanium Metallic",66,66,62,0,1  ],
  ["268"," Medium Lilac",71,51,141,0,0  ],
  ["135"," Sand Blue",108,130,149,0,0  ],
  ["28"," Dark Green",64,143,79,0,0  ],
  ["330"," Olive Green",130,130,89,0,0  ],
  ["312"," Medium Nougat",167,188,78,0,0  ],
  ["38"," Dark Orange",156,87,46,0,0  ],
  ["199"," Dark Stone Grey",101,103,101,0,0  ],
  ["297"," Warm Gold",189,152,73,0,1  ],
  ["154"," New dark Red",117,30,32,0,0  ],
  ["140"," Earth Blue",19,57,91,0,0  ],
  ["141"," Earth Green",29,72,47,0,0  ],
  ["308"," Dark Brown",55,26,16,0,0  ],
  ["26"," Black",0,0,0,0,0  ],
  ["315"," Silver Metallic",136,141,143,0,1  ],
  ["44"," Transp. Yellow",244,211,74,1,0  ],
  ["182"," Tr. Bright Orange",231,140,68,1,0  ],
  ["47"," Tr. Fl. Red Orange",224,98,59,1,0  ],
  ["41"," Transp. Red",211,55,50,1,0  ],
  ["113"," Tr. Meduim Violet",217,92,154,1,0  ],
  ["126"," Tr. Bright Violet",116,116,178,1,0  ],
  ["43"," Transp. Blue",65,151,207,1,0  ],
  ["143"," Tr. Fluor. Blue",148,200,225,1,0  ],
  ["42"," Transp. Light Blue",118,192,190,1,0  ],
  ["48"," Transp. Green",74,165,90,1,0  ],
  ["49"," Tr. Fluor. Green",226,223,83,1,0  ],
  ["311"," Tr. Bright Green",160,197,99,1,0  ],
  ["111"," Transp. Brown",149,135,112,1,0  ],
  ["40"," Transparent",239,239,239,1,0  ]
];
