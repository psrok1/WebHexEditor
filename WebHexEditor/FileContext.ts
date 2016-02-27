module Datastore {
    export class FileSection {
        startOffset: number;
        name: string;
    }

    interface DataLayoutElement {
        offset: number;
        dataLength?: number;
        section?: FileSection;
    }

    type DataLayout = DataLayoutElement[];

    export class DataView {
        data: number[];
        layout: DataLayout;
        markedFields: any[];
    }

    export class FileContext {
        private workerInstance: DatastoreWorker.WorkerInstance;

        private fileSize;
        private selection;
        private sections: FileSection[] = [];
        private markedFields = [];

        constructor(source: File, onLoad: () => any) {
            this.fileSize = source.size;
            this.workerInstance = new DatastoreWorker.WorkerInstance(source, onLoad);
        }

        public getNumberOfRows() {
            var rowsNumber = Math.ceil(this.fileSize / 16);
            for (var section of this.sections) {
                if (section.startOffset % 16 != 0)
                    rowsNumber += 2;
                else
                    rowsNumber += 1;
            }
            return rowsNumber;
        }

        public /*private*/ getDataLayout(rowNo: number, rowsLimit: number): DataLayout {
            var layout: DataLayout = [];
            var predSectionIndex: number = null;
            var predSectionRow: number = null;
            var succSectionIndex: number = null;
            var succSectionRow: number = null;
            var rowShift: number = 0;
            var getRowNumber = function (offs: number) {
                return Math.floor(offs / 16) + rowShift;
            }

            // Find section-predecessor
            for (var i = 0; i < this.sections.length; i++) {
                var section = this.sections[i];
                if (section.startOffset % 0x10 != 0)
                    ++rowShift;
                succSectionRow = getRowNumber(section.startOffset);
                succSectionIndex = i;

                if (succSectionRow >= rowNo)
                    break;
                else {
                    predSectionIndex = i;
                    predSectionRow = succSectionRow;
                }
                ++rowShift;
            }

            // Get current row byte offset
            var currentOffset;
            var currentRow;

            if (predSectionIndex === null) {
                currentOffset = rowNo * 16;
                currentRow = rowNo;
            } else {
                currentOffset = this.sections[predSectionIndex].startOffset;
                currentRow = predSectionRow;

                if (rowNo >= currentRow + 2)
                    currentOffset += 16 - (currentOffset % 16) + 16 * (rowNo - currentRow - 2);

                currentRow = rowNo;
            }

            // Build layout array
            while (layout.length < rowsLimit && currentOffset < this.fileSize) {
                if (succSectionIndex !== null && currentOffset >= this.sections[succSectionIndex].startOffset) {
                    // Section?
                    layout.push({
                        offset: this.sections[succSectionIndex].startOffset,
                        section: this.sections[succSectionIndex]
                    });
                    // Rows limit reached?
                    if (layout.length >= rowsLimit)
                        break;
                    // Current offset is section offset
                    currentOffset = this.sections[succSectionIndex].startOffset;
                    // Middle-section?
                    if (this.sections[succSectionIndex].startOffset % 16 !== 0) {
                        var diff = 16 - (this.sections[succSectionIndex].startOffset % 16);
                        // Trim data block before this section
                        if (layout.length > 2 && !layout[layout.length - 2].section) {
                            layout[layout.length - 2].dataLength -= diff;
                        }
                    }
                    
                    // Find next succ-section
                    succSectionIndex += 1;
                    if (succSectionIndex >= this.sections.length)
                        succSectionIndex = null;
                } else {
                    // Add data block
                    var diff = 16 - (currentOffset % 16);
                    layout.push({
                        offset: currentOffset,
                        dataLength: diff
                    });
                    currentOffset += diff;
                }
            }

            // TODO: Test trimming of last layout entry to file size
            if (currentOffset > this.fileSize) {
                layout[layout.length - 1].dataLength -= (currentOffset - this.fileSize);
            }
            return layout;
        }
        
        public readRows(rowNo: number, rowsLimit: number, onSuccess: (dataview : DataView) => any) {
            var layout = this.getDataLayout(rowNo, rowsLimit);
            this.workerInstance.sendRequest(
                /* request */
                new DatastoreWorker.ReadRequest(layout[0].offset, rowsLimit * 16),
                /* response handler */
                (e: MessageEvent) => {
                    var response: DatastoreWorker.ReadResponse = e.data;
                    var resultView = new DataView();
                    resultView.data = response.data;
                    resultView.layout = layout;
                    // TODO: resultView.markedFields
                    onSuccess(resultView);
                }
            );
        }
    }
}