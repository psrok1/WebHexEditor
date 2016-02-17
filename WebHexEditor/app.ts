module View {
    class Editor {
        private editorElement: HTMLDivElement;

        private elementOffsetColumn: HTMLDivElement;
        private elementByteData: HTMLDivElement;
        private elementAsciiData: HTMLDivElement;

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

        getHTMLElement(): HTMLDivElement {
            return this.editorElement;
        }
    }
}