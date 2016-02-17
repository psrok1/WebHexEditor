module DataManagement {
    export class DataSource {
        /* File data source */
        private fileObject: File;
        private fileReader: FileReader = new FileReader();
        /* Data block structure */
        private dataBlocks: IDataBlockSet;

        constructor(source: File) {
            this.fileObject = source;
            this.dataBlocks = new IDataBlockSet(source.size);
        }

        readBytes(offs: number, len: number, cbreader: (offs: number, data: number[]) => any) {
            /* CAN BE OPTIMIZED:
             * - if distance between separated Origin blocks is smaller than xxx
             *   data for them should be loaded in one readAsArrayBuffer call
            */
            Benchmark.startTimer("DataSource.readBytes");
            var blocks = this.dataBlocks.readBlocks(offs, len);
            console.log(blocks);
            var data = [];
            var blocksToResolve: OriginIDataBlock[] = [];
            var resolveNextBlock = () => {
                var resolvingBlock = blocksToResolve.pop();
                if (!resolvingBlock) {
                    Benchmark.stopTimer("DataSource.readBytes");
                    cbreader(offs, data);
                    return;
                }
                this.fileReader.onloadend = (evt: any) => {
                    if (evt.target.readyState != 2)
                        return;

                    var originData = Array.apply([], new Uint8Array(<ArrayBuffer>(evt.target.result)));
                    data.splice.apply(data, [resolvingBlock.offs_start - offs, 0].concat(originData));
                    resolveNextBlock();
                }
                var fileBytes = this.fileObject.slice(resolvingBlock.origin_start, resolvingBlock.origin_end);
                this.fileReader.readAsArrayBuffer(fileBytes);
            };

            for (var block of blocks) {
                if (block instanceof OriginIDataBlock) {
                    blocksToResolve.push(<OriginIDataBlock>(block));        
                }
                else if (block instanceof ModifiedIDataBlock) {
                    data.splice.apply(data, [block.offs_start - offs, 0].concat((<ModifiedIDataBlock>block).content));
                }
                //else if (block instanceof RLEIDataBlock) {
                //    for (var i = 0; i < (<RLEIDataBlock>block).length; i++)
                //        data[block.offs_start - offs + i] = (<RLEIDataBlock>block).pattern;
                //}
            }
            resolveNextBlock();
        }

        insertBytes(offs: number, bytes: number[]) {
            Benchmark.startTimer("DataSource.insertBytes");
            this.dataBlocks.insertBlock(new ModifiedIDataBlock(offs, bytes));
            Benchmark.stopTimer("DataSource.insertBytes");
        }

        removeBytes(offs: number, length: number) {
            Benchmark.startTimer("DataSource.removeBytes");
            this.dataBlocks.removeBlock(offs, offs + length - 1);
            Benchmark.stopTimer("DataSource.removeBytes");
        }

        overwriteBytes(offs: number, bytes: number[]) {
            Benchmark.startTimer("DataSource.overwriteBytes");
            this.removeBytes(offs, bytes.length);
            this.insertBytes(offs, bytes);
            Benchmark.stopTimer("DataSource.overwriteBytes");
        }
    }
}

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