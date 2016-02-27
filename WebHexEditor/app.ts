module View {
    export class Editor {
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
            this.elementAsciiData.innerHTML = "<div class=\"ed-row\">&nbsp;</div>";
            this.elementByteData.innerHTML = "<div class=\"ed-row ed-offs-row\">" +
                "<div>00</div><div>01</div><div>02</div><div>03</div><div>04</div>" +
                "<div>05</div><div>06</div><div>07</div><div>08</div><div>09</div>" +
                "<div>0A</div><div>0B</div><div>0C</div><div>0D</div><div>0E</div><div>0F</div></div>";
        }

        private appendSectionRow(sectionName: string) {
            var sectionNameString = " SECTION " + sectionName + " ";
            var stringPosition = Math.floor((48 - sectionNameString.length) / 2);
            var sectionString =
                Array(stringPosition + 1).join("-") +
                sectionNameString +
                Array(48 - (stringPosition + sectionNameString.length) + 1).join("-");

            this.elementOffsetColumn.innerHTML += "<div>&nbsp;</div>";
            this.elementAsciiData.innerHTML += "<div class=\"ed-row\">&nbsp;</div>";
            this.elementByteData.innerHTML += "<div class=\"ed-row\"><div class=\"section-cell\">"+sectionString+"</div></div>";
        }

        private appendDataRow(origin: number, data: number[]) {
            /* OffsetColumn */
            var offsetElement: HTMLDivElement = document.createElement("div");
            offsetElement.innerHTML = Converters.hexWithPad(origin, 8);
            this.elementOffsetColumn.appendChild(offsetElement);

            /* ByteData */
            var row: HTMLDivElement = document.createElement("div");
            row.className = "ed-row";
            for (var i = 0; i < (origin % 16); i++) {
                var valueNode: HTMLDivElement = document.createElement("div");
                valueNode.innerHTML = "&nbsp;&nbsp;";
                row.appendChild(valueNode);
            }

            for (var i = 0; i < data.length; i++) {
                var valueNode: HTMLDivElement = document.createElement("div");
                valueNode.innerHTML = Converters.hexWithPad(data[i], 2);
                row.appendChild(valueNode);
            }
            this.elementByteData.appendChild(row);
            
            /* AsciiData */
            var row: HTMLDivElement = document.createElement("div");
            row.className = "ed-row";
            for (var i = 0; i < (origin % 16); i++) {
                var valueNode: HTMLDivElement = document.createElement("div");
                valueNode.innerHTML = "&nbsp;";
                row.appendChild(valueNode);
            }

            for (var i = 0; i < data.length; i++) {
                var valueNode: HTMLDivElement = document.createElement("div");
                valueNode.innerHTML = Converters.byteToAscii(data[i]);
                row.appendChild(valueNode);
            }
            this.elementAsciiData.appendChild(row);
        }

        public updateWithDataview(dataview: Datastore.DataView) {
            var origin = dataview.layout[0].offset;

            this.drawEmptyTemplate();
            for (var row of dataview.layout) {
                if (row.section) {
                    this.appendSectionRow(row.section.name);
                } else {
                    var startIndex = row.offset - origin;
                    var endIndex = startIndex + row.dataLength;
                    var data = dataview.data.slice(startIndex, endIndex);
                    this.appendDataRow(row.offset, data);
                }
            }
        }

        getHTMLElement(): HTMLDivElement {
            return this.editorElement;
        }
    }
}