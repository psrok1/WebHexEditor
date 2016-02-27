module Tests {
    var fileContext;

    export function initContext() {
        var file = (<HTMLInputElement>document.getElementById("fileSelector")).files[0];
        fileContext = new Datastore.FileContext(file, () => {
            console.log("ok");
        });
    }

    export function readRows(rowNo, rowsLimit) {
        console.profile("readTest");
        fileContext.readRows(rowNo, rowsLimit, (dataview: Datastore.DataView) => {
            console.profileEnd();
            console.log(dataview.layout.length + " rows of " + fileContext.getNumberOfRows());
            var data = dataview.data;
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
                var rowString = "%c" + pad32(row.offset) + "%c ";
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
        });
    }
}