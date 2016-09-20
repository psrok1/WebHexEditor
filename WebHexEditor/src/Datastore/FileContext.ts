import DatastoreWorker = require("./DatastoreWorkerRequest.ts");
import WorkerInstance from "./DatastoreWorkerInstance.ts"
import DataCache from "./DataCache.ts"

/**
 TODO:
    Section lookup will be done very often, but is implemented as
    simple iterating over array. If it turns out that we need sometimes
    lots of sections, something based on binary search should be introduced.
**/

interface FileSection {
    offset: number;
    label: string;
}

interface FileLayoutElement {
    offset: number;
    dataLength?: number;
    section?: FileSection;
}

interface FileLayout {
    rowStart: number;
    width: number;
    layout: FileLayoutElement[];
}

export enum FileByteSpecial {
    PENDING = 256,
    EOF     = 257
}

export type FileByte = FileByteSpecial | number;

export interface FileData {
    offset: number;
    complete: boolean;
    data: Array<FileByte>;
}

export interface FileRow {
    rowNo: number;
    padding?: number;
    fileData?: FileData;
    sectionLabel?: string;
    sectionOffset?: number;
}

export default class FileContext {
    // Asynchronous data interface
    private workerInstance: WorkerInstance;
    // Cache for synchronous reading from contiguous rows
    private dataCache: DataCache;
    // Prevent executing additional requests until current will be finished
    private waitingForData: boolean = false;
    // Layout evaluated for current view
    // Should be invalidated when list of sections is updated
    private currentLayout: FileLayout = null;

    // @debug: predefined section
    private sections: FileSection[] = [
        {
            offset: 44,
            label: "SECTION .TEXT"
        },
        {
            offset: 177,
            label: "SECTION .DATA"
        },
        {
            offset: 180,
            label: "Special section"
        },
        {
            offset: 320,
            label: "SECTION .RSRC"
        }];

    private fileSize: number;
    private onUpdateAction: () => any;

    constructor(file: File, onInitialized: () => any, onUpdate: () => any) {
        this.fileSize = file.size;
        this.workerInstance = new WorkerInstance(file, onInitialized);
        this.dataCache = new DataCache();
        this.onUpdateAction = onUpdate;
    }

    // Data cache sometimes requests data. We need to handle it
    private onDataRequest(offs: number, size: number) {
        // Trim to file size
        size = Math.min(size, this.fileSize - offs);

        this.workerInstance.sendRequest(
            /* request */
            new DatastoreWorker.ReadRequest(offs, size),
            /* response handler */
            (e: MessageEvent) => {
                var response: DatastoreWorker.ReadResponse = e.data;

                this.dataCache.insertPage(offs, response.data);
                this.waitingForData = false;
                this.onUpdateAction();
            }
        );
    }

    public getNumberOfRows(width: number = 16): number {
        var rowsNumber = Math.ceil((this.fileSize + 1) / width);
        for (var section of this.sections) {
            if (section.offset % width != 0)
                rowsNumber += 2;
            else
                rowsNumber += 1;
        }
        return rowsNumber;
    }

    /**
     * Returns data layout for specified starting row
     * @param rowNo Starting row number
     * @param rowsLimit Count of visible rows
     * @param width Single row width
     */
    private getFileLayout(rowNo: number, rowsLimit: number, width: number = 16): FileLayout {
        var size: number = this.fileSize + 1; // Place for append
        var layout: FileLayoutElement[] = [];
        var predSectionIndex: number = null;
        var predSectionRow: number = null;
        var succSectionIndex: number = null;
        var succSectionRow: number = null;
        var rowShift: number = 0;
        var getRowNumber = function (offs: number) {
            return Math.floor(offs / width) + rowShift;
        }

        // Find section-predecessor
        for (var i = 0; i < this.sections.length; i++) {
            var section = this.sections[i];
            // If section breaks the row: we need to shift next rows
            if (section.offset % width)
                ++rowShift;

            var sectionRow = getRowNumber(section.offset);

            if (sectionRow >= rowNo)
            {
                succSectionRow = sectionRow;
                succSectionIndex = i;
                break;
            }
            else {
                predSectionRow = sectionRow;
                predSectionIndex = i;
            }
            ++rowShift;
        }

        // Get current row byte offset
        var currentOffset: number;
        var currentRow: number;

        if (predSectionIndex === null) {
            currentOffset = rowNo * width;
            currentRow = rowNo;
        } else {
            currentOffset = this.sections[predSectionIndex].offset;
            currentRow = predSectionRow;

            if (rowNo >= currentRow + 2)
                currentOffset += width - (currentOffset % width) + width * (rowNo - currentRow - 2);

            currentRow = rowNo;
        }

        // Build layout array
        while (layout.length < rowsLimit && currentOffset < size) {
            if (succSectionIndex !== null && currentOffset >= this.sections[succSectionIndex].offset) {
                // Section?
                layout.push({
                    offset: this.sections[succSectionIndex].offset,
                    section: this.sections[succSectionIndex]
                });
                // Rows limit reached?
                if (layout.length >= rowsLimit)
                    break;
                // Current offset is section offset
                currentOffset = this.sections[succSectionIndex].offset;
                // Middle-section?
                if (this.sections[succSectionIndex].offset % width !== 0) {
                    var diff = width - (this.sections[succSectionIndex].offset % width);
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
                var diff = width - (currentOffset % width);
                layout.push({
                    offset: currentOffset,
                    dataLength: diff
                });
                currentOffset += diff;
            }
        }

        // TODO: Test trimming of last layout entry to file size
        if (currentOffset > size) {
            layout[layout.length - 1].dataLength -= (currentOffset - size);
        }

        return {
            layout: layout,
            rowStart: rowNo,
            width: width
        }
    }

    /**
     * Reads data from specified offset
     */
    private readData(offset: number, length: number): FileData {
        var result: FileData = {
            offset: offset,
            complete: true,
            data: []
        };

        for (var i = 0; i < length; i++) {
            if ((offset + i + 1) > this.fileSize) {
                // End of file reached?
                result.data.push(FileByteSpecial.EOF);
                break;
            }
            else if (this.waitingForData) {
                result.data.push(FileByteSpecial.PENDING);
                result.complete = false;
            }
            else {
                var val = this.dataCache.getByte(offset + i, this.onDataRequest.bind(this));
                if (val == null) {
                    this.waitingForData = true;
                    result.data.push(FileByteSpecial.PENDING);
                    result.complete = false;
                } else
                    result.data.push(val);
            }
        }

        return result;
    }

    public getByteCoordinates(position: number, width: number = 16): { row: number, column: number } {
        var section: FileSection;
        var rowShift: number = 0;

        // Do section lookup and evaluate row-shift
        for (var i = 0; i < this.sections.length && this.sections[i].offset <= position; i++ , rowShift++)
        {
            section = this.sections[i];
            // If section breaks the row: we need to shift next rows
            if (section.offset % width)
                ++rowShift;
        }

        return {
            row: Math.floor(position / width) + rowShift,
            column: position % width
        }
    }

    public readRow(rowNo: number, width: number = 16): FileRow {
        if (this.currentLayout == null ||
            this.currentLayout.width != width ||
            rowNo < this.currentLayout.rowStart ||
            rowNo >= (this.currentLayout.rowStart + this.currentLayout.layout.length))
        {
            this.currentLayout = this.getFileLayout(rowNo, 64, width);
        }

        var rowLayout = this.currentLayout.layout[rowNo - this.currentLayout.rowStart];

        if (rowLayout.section)
            return {
                rowNo: rowNo,
                sectionLabel: rowLayout.section.label,
                sectionOffset: rowLayout.section.offset
            }

        var data = this.readData(rowLayout.offset, rowLayout.dataLength);

        return {
            rowNo: rowNo,
            fileData: data,
            padding: rowLayout.offset % width
        };
    }

    public getFileSize(): number {
        return this.fileSize;
    }
}