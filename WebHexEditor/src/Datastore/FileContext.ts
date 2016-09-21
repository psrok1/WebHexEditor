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

    private fileName: string;
    private fileSize: number;
    private onUpdateAction: () => any;

    constructor(file: File, onInitialized: () => any, onUpdate: () => any) {
        this.fileName = file.name;
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
        for (var section of this.sections)
        {
            if (section.offset >= (this.fileSize + 1))
                break;

            if (section.offset % width != 0)
                rowsNumber += 1;

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
            // If row is not preceded by section: we can do simple calculation
            currentOffset = rowNo * width;
            currentRow = rowNo;
        } else {
            // If it has a predecessor
            currentOffset = this.sections[predSectionIndex].offset;
            currentRow = predSectionRow;

            // currentRow is row for section
            // currentRow+1 is row with offset described by currentOffset

            if (rowNo >= currentRow + 2)
                currentOffset += width * (rowNo - currentRow - 1) - (currentOffset % width);

            currentRow = rowNo;
        }

        if (currentOffset >= size)
        {
            console.error("<BUG> Request to getFileLayout with row, which doesn't exist");
            return {
                layout: [],
                rowStart: rowNo,
                width: width
            };
        }

        console.log("--------------------");
        console.log("row=" + currentRow + " offs=" + currentOffset);

        var baseValue = (off: number) => Math.floor(off / width) * width;

        console.log("size=" + size);
        // Build layout array
        while (layout.length < rowsLimit && currentOffset < size) {
            // My row is breaked by section? (or is it section row?)
            if (succSectionIndex !== null &&
                baseValue(this.sections[succSectionIndex].offset) == baseValue(currentOffset)) {
                var succSectionOffset = this.sections[succSectionIndex].offset;
                // I'm just before section, which is breaking my row
                if (succSectionOffset > currentOffset) {
                    console.log("Just before section offs=" + currentOffset);
                    layout.push({
                        offset: currentOffset,
                        dataLength: succSectionOffset - currentOffset
                    });
                    currentOffset = succSectionOffset;
                    console.log("offs now=" + currentOffset);
                }
                // That's section row
                else if (succSectionOffset == currentOffset) {
                    console.log("Section row offs=" + currentOffset);
                    layout.push({
                        offset: succSectionOffset,
                        section: this.sections[succSectionIndex]
                    });

                    // Find next succ-section
                    succSectionIndex += 1;
                    if (succSectionIndex >= this.sections.length)
                        succSectionIndex = null;
                }
            } else {
                console.log("Data row offs=" + currentOffset);
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

    private invalidateLayout() {
        this.currentLayout = null;
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

    public insertBytes(position: number, bytes: number[]) {
        // Pre-request size "prediction"
        this.fileSize += bytes.length;
        this.invalidateLayout();

        // Write-through
        if (bytes.length == 1)
            this.dataCache.insertByte(position, bytes[0])
        else
            this.dataCache.invalidate();

        this.workerInstance.sendRequest(
            /* request */
            new DatastoreWorker.InsertRequest(position, bytes),
            /* response handler */
            (e: MessageEvent) => {
                var response: DatastoreWorker.SuccessResponse = e.data;
                this.fileSize = response.newFileSize;
                this.onUpdateAction();
            }
        );
    }

    public overwriteBytes(position: number, bytes: number[]) {
        // Pre-request size "prediction"
        this.fileSize = Math.max(this.fileSize, position + bytes.length);
        this.invalidateLayout();

        // Write-through
        if (bytes.length == 1)
            this.dataCache.setByte(position, bytes[0])
        else
            this.dataCache.invalidate();

        this.workerInstance.sendRequest(
            /* request */
            new DatastoreWorker.OverwriteRequest(position, bytes),
            /* response handler */
            (e: MessageEvent) => {
                var response: DatastoreWorker.SuccessResponse = e.data;
                this.fileSize = response.newFileSize;
                this.onUpdateAction();
            }
        );
    }

    public deleteBytes(position: number, bytes: number) {
        // Deleting EOF isn't good idea
        if (position >= this.fileSize)
            return;

        // Pre-request size "prediction"
        if ((position + bytes - 1) < this.fileSize)
            this.fileSize -= bytes;
        else
            this.fileSize = position;

        this.invalidateLayout();
        this.dataCache.invalidate();

        this.workerInstance.sendRequest(
            /* request */
            new DatastoreWorker.RemoveRequest(position, bytes),
            /* response handler */
            (e: MessageEvent) => {
                var response: DatastoreWorker.SuccessResponse = e.data;
                this.fileSize = response.newFileSize;
                this.onUpdateAction();
            });
    }

    public saveFile() {
        var startDownload = (url: string, name: string) => {
            var a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            (a as any).download = name;
            a.click();
        }

        this.workerInstance.sendRequest(
            /* request */
            new DatastoreWorker.SaveRequest(),
            /* response handler */
            (e: MessageEvent) => {
                var response: DatastoreWorker.SaveResponse = e.data;
                startDownload(response.blobURL, this.fileName);
                window.URL.revokeObjectURL(response.blobURL);
                this.onUpdateAction();
            });
    }
}