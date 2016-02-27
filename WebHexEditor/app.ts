module Tests {
    var fileContext: Datastore.FileContext;
    function compareLayouts(result: Datastore.DataLayout, pattern: Datastore.DataLayout) {
        var wasError = false;
        for (var i = 0; i < result.length; i++) {
            if ((result[i].section ? 1 : 0) ^ (pattern[i].section ? 1 : 0)) {
                console.log("Error in row " + i + ": result " + (result[i].section ? "is" : "isn't") + " section but it "
                    + (pattern[i].section ? "should be" : "shouldn't be"));
                wasError = true;
            }
            else if (result[i].offset != pattern[i].offset) {
                console.log("Error in row " + i + ": offsets doesn't match");
                wasError = true;
            }
            else if (result[i].section && result[i].dataLength != pattern[i].dataLength) {
                console.log("Error in row " + i + ": dataLengths doesn't match");
                wasError = true;
            }

            if (wasError) {
                console.log("\tresult: ");
                console.log(result[i]);
                console.log("\texpected: ");
                console.log(pattern[i]);
                return;
            }
        }
        console.log("passed");
    }

    function testFileContext_routine1() {
        console.log("Test 1 ------");
        fileContext.sections.push({
            startOffset: 0x28,
            name: ""
        });
        fileContext.sections.push({
            startOffset: 0x40,
            name: ""
        });

        compareLayouts(fileContext.getDataLayout(0, 8), <any[]>[
            { offset: 0x0, dataLength: 0x10 },
            { offset: 0x10, dataLength: 0x10 },
            { offset: 0x20, dataLength: 8 },
            { offset: 0x28, section: true },
            { offset: 0x28, dataLength: 8 },
            { offset: 0x30, dataLength: 0x10 },
            { offset: 0x40, section: true },
            { offset: 0x40, dataLength: 0x10 }
        ]);
    }

    function testFileContext_routine2() {
        console.log("Test 2 ------");
        fileContext.sections.push({
            startOffset: 0x1C,
            name: ""
        });
        fileContext.sections.push({
            startOffset: 0x28,
            name: ""
        });
        
        compareLayouts(fileContext.getDataLayout(0, 8), <any[]>[
            { offset: 0x0, dataLength: 0x10 },
            { offset: 0x10, dataLength: 12 },
            { offset: 0x1C, section: true },
            { offset: 0x1C, dataLength: 4 },
            { offset: 0x20, dataLength: 8 },
            { offset: 0x28, section: true },
            { offset: 0x28, dataLength: 8 },
            { offset: 0x30, dataLength: 0x10 }
        ]);
    }

    function testFileContext_routine3() {
        console.log("Test 3 ------");
        fileContext.sections.push({
            startOffset: 0x28,
            name: ""
        });
        fileContext.sections.push({
            startOffset: 0x28,
            name: ""
        });
        fileContext.sections.push({
            startOffset: 0x28,
            name: ""
        });
        compareLayouts(fileContext.getDataLayout(0, 8), <any[]>[
            { offset: 0x0, dataLength: 0x10 },
            { offset: 0x10, dataLength: 0x10 },
            { offset: 0x20, dataLength: 8 },
            { offset: 0x28, section: true },
            { offset: 0x28, section: true },
            { offset: 0x28, section: true },
            { offset: 0x28, dataLength: 8 },
            { offset: 0x30, dataLength: 0x10 }
        ]);
    }

    function testFileContext_routine4() {
        console.log("Test 4 ------");
        fileContext.sections.push({
            startOffset: 0x28,
            name: ""
        });
        fileContext.sections.push({
            startOffset: 0x29,
            name: ""
        });
        fileContext.sections.push({
            startOffset: 0x30,
            name: ""
        });
        compareLayouts(fileContext.getDataLayout(0, 8), <any[]>[
            { offset: 0x0, dataLength: 0x10 },
            { offset: 0x10, dataLength: 0x10 },
            { offset: 0x20, dataLength: 8 },
            { offset: 0x28, section: true },
            { offset: 0x28, dataLength: 1 },
            { offset: 0x29, section: true },
            { offset: 0x29, dataLength: 1 },
            { offset: 0x30, section: true },
        ]);
    }

    function testFileContext(testRoutine: () => any) {
        var file = (<HTMLInputElement>document.getElementById("fileSelector")).files[0];
        fileContext = new Datastore.FileContext(file, testRoutine);
    }

    export function startTests() {
        setTimeout(testFileContext.bind(this, testFileContext_routine1), 1000);
        setTimeout(testFileContext.bind(this, testFileContext_routine2), 2000);
        setTimeout(testFileContext.bind(this, testFileContext_routine3), 3000);
        setTimeout(testFileContext.bind(this, testFileContext_routine4), 4000);
    }

    export function readRows(rowNo, rowsLimit) {
        console.profile("readTest");
        var file = (<HTMLInputElement>document.getElementById("fileSelector")).files[0];
        fileContext = new Datastore.FileContext(file, () => {
            fileContext.readRows(rowNo, rowsLimit, (data: number[], dataview: Datastore.DataView) => {
                var pad32 = (num): string => {
                    var s = "000000000" + num.toString(16);
                    return s.substr(s.length - 8);
                }

                var pad8 = (num): string => {
                    var s = "00" + num.toString(16);
                    return s.substr(s.length - 2);
                }

                var origin = dataview.layout[0].offset;
                console.log("%c         00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F", "font-weight:bold");
                for (var row of dataview.layout) {
                    var rowString = "%c"+pad32(row.offset) + "%c ";
                    if (row.section) {
                        rowString += "---- SECTION " + row.section.name;
                    } else {
                        var fieldPadding = row.offset % 16;
                        for (var i = 0; i < fieldPadding; i++)
                            rowString += "   ";
                        for (var i = 0; i < row.dataLength; i++)
                            rowString += pad8(data[row.offset + i - origin]) + " ";
                    }
                    console.log(rowString, "font-weight:bold", "font-weight: normal");
                }
                console.profileEnd();
            });
        });
    }
}

module View {
    class Editor {
        private editorElement: HTMLDivElement = null;

        private elementOffsetColumn: HTMLDivElement;
        private elementByteData: HTMLDivElement;
        private elementAsciiData: HTMLDivElement;

        private fileContext: Datastore.FileContext = null;

        constructor() {
            var editorElement = document.createElement("div");
            editorElement.className = "editor";
            this.editorElement = editorElement

            var offsColumn = document.createElement("div");
            offsColumn.className = "ed-offs-column";
            editorElement.appendChild(offsColumn);
            this.elementOffsetColumn = offsColumn;

            var byteData = document.createElement("div");
            byteData.className = "ed-byte-data";
            editorElement.appendChild(byteData);
            this.elementByteData = byteData;

            var asciiData = document.createElement("div");
            asciiData.className = "ed-ascii-data";
            editorElement.appendChild(asciiData);
            this.elementAsciiData = asciiData;
        }

        private drawEmptyTemplate() {
            this.elementOffsetColumn.innerHTML = "<div>&nbsp;</div>";
            this.elementAsciiData.innerHTML = "<div class=\"ed-row\"><div>&nbsp;</div></div>";
            this.elementByteData.innerHTML = "<div class=\"ed-row ed-offs-row\">" +
                "<div>00</div><div>01</div><div>02</div><div>03</div><div>04</div>" +
                "<div>05</div><div>06</div><div>07</div><div>08</div><div>09</div>" +
                "<div>0A</div><div>0B</div><div>0C</div><div>0D</div><div>0E</div><div>0F</div></div>";
        }

        getHTMLElement(): HTMLDivElement {
            return this.editorElement;
        }
    }
}