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
            Benchmark.startTimer("DataSource.readBytes");
            // Scan structure of requested data
            var blocks = this.dataBlocks.readBlocks(offs, len);
            var data = [];
            /*
                If separate OriginIDataBlocks have near origin address:
                it's faster to load one big continuous fragment than lots of smaller fragments.
                Instances of class implemented below have information about:
                    * address range of chunk being loaded
                    * related IDataBlocks
            */
            class OriginToResolve {
                origin_start: number;
                origin_end: number;
                origin_blocks: OriginIDataBlock[];

                private isBlockNear(block: OriginIDataBlock) {
                    return (block.origin_start - this.origin_end) <= 128;
                }

                pushBlock(block: OriginIDataBlock): boolean {
                    if (!this.isBlockNear(block))
                        return false;

                    this.origin_blocks.push(block);
                    this.origin_end = block.origin_end;
                    return true;
                }

                constructor(block: OriginIDataBlock) {
                    this.origin_start = block.origin_start;
                    this.origin_end = block.origin_end;
                    this.origin_blocks = [block];
                }
            }

            // Queue of origins need to be resolved
            var originsToResolve: OriginToResolve[] = [];

            // Function, which resolve next origin from queue
            var resolveNextOrigin = () => {
                // Get next origin from queue
                var originBeingResolved = originsToResolve.pop();
                // If queue is empty: pass loaded data to target
                if (!originBeingResolved) {
                    Benchmark.stopTimer("DataSource.readBytes");
                    cbreader(offs, data);
                    return;
                }
                // If chunk is loaded from file: process
                this.fileReader.onloadend = (evt: any) => {
                    if (evt.target.readyState != 2)
                        return;

                    var originData = Array.apply([], new Uint8Array(<ArrayBuffer>(evt.target.result)));

                    for (var origin of originBeingResolved.origin_blocks) {
                        var chunkStartIdx = origin.origin_start - originBeingResolved.origin_start;
                        var chunkEndIdx = origin.origin_end - originBeingResolved.origin_end;
                        var dataChunk = originData.slice(chunkStartIdx, chunkEndIdx + 1);

                        data.splice.apply(data, [origin.origin_start - offs, 0].concat(dataChunk));
                    }
                    resolveNextOrigin();
                }
                // Start loading chunk from file
                var fileBytes = this.fileObject.slice(originBeingResolved.origin_start, originBeingResolved.origin_end);
                this.fileReader.readAsArrayBuffer(fileBytes);
            };

            // For each block of data
            for (var block of blocks) {
                // Determine whether content is stored locally or need to be loaded from file.
                if (block instanceof OriginIDataBlock) {
                    // If it's "remote": add block to queue
                    if (originsToResolve.length == 0 ||
                        !originsToResolve[originsToResolve.length - 1].pushBlock(block)) {
                        originsToResolve.push(new OriginToResolve(block));
                    }
                }
                else if (block instanceof ModifiedIDataBlock) {
                    // If it's "local": insert into buffer
                    data.splice.apply(data, [block.offs_start - offs, 0].concat((<ModifiedIDataBlock>block).content));
                }
                //else if (block instanceof RLEIDataBlock) {
                //    for (var i = 0; i < (<RLEIDataBlock>block).length; i++)
                //        data[block.offs_start - offs + i] = (<RLEIDataBlock>block).pattern;
                //}
            }
            // Start resolving remote blocks
            resolveNextOrigin();
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
