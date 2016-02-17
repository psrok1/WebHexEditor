module DatastoreWorker {
    export module DataSource {
        /* File data source */
        export var fileObject: File;
        export var fileReader: FileReader = new FileReader();
        /* Data block structure */
        export var dataBlocks: IDataBlockSet;

        export function init(source: File) {
            fileObject = source;
            dataBlocks = new IDataBlockSet(source.size);
        }

        export function readBytes(offs: number, len: number, cbreader: (offs: number, data: number[]) => any) {
            // Scan structure of requested data
            var blocks = dataBlocks.readBlocks(offs, len);
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

                // Assumes that blocks will be pushed sequentially
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
                    cbreader(offs, data);
                    return;
                }
                // If chunk is loaded from file: process
                fileReader.onloadend = (evt: any) => {
                    if (evt.target.readyState != 2)
                        return;

                    var originData = Array.apply([], new Uint8Array(<ArrayBuffer>(evt.target.result)));

                    for (var origin of originBeingResolved.origin_blocks) {
                        var chunkStartIdx = origin.origin_start - originBeingResolved.origin_start;
                        var chunkEndIdx = origin.origin_end - originBeingResolved.origin_start;
                        var dataChunk = originData.slice(chunkStartIdx, chunkEndIdx + 1);

                        data.splice.apply(data, [origin.offs_start - offs, 0].concat(dataChunk));
                    }
                    resolveNextOrigin();
                }
                // Start loading chunk from file
                var fileBytes = fileObject.slice(originBeingResolved.origin_start, originBeingResolved.origin_end + 1);
                fileReader.readAsArrayBuffer(fileBytes);
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
    }
}