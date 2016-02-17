module DataManagement {
    export class IDataBlockSet {
        private blocks: IDataBlock[];

        constructor(size: number) {
            this.blocks = [
                new OriginIDataBlock(0, size - 1)
            ];
        }

        private findBlock(offs: number): number {
            var minIndex = 0;
            var maxIndex = this.blocks.length - 1;

            while (minIndex <= maxIndex) {
                var currentIndex = Math.floor((minIndex + maxIndex) / 2) | 0;
                var currentElement = this.blocks[currentIndex];
                var distance = currentElement.getBlockDistance(offs);

                if (distance == 1) {
                    minIndex = currentIndex + 1;
                }
                else if (distance == -1) {
                    maxIndex = currentIndex - 1;
                }
                else {
                    return currentIndex;
                }
            }
            return -1;
        }

        private findFirstGreaterOrEqual(offs: number): number {
            var lower = 0;
            var upper = this.blocks.length;

            while (upper > lower) {
                var mid = Math.floor((lower + upper) / 2);
                var currentElement = this.blocks[mid];
                var distance = currentElement.getBlockDistance(offs);

                if (distance == -1 || distance == 0) {
                    upper = mid;
                }
                else {
                    lower = mid + 1;
                }
            }
            return lower;
        }

        private findLastLessOrEqual(offs: number): number {
            var lower = 0;
            var upper = this.blocks.length;

            while (upper > lower) {
                var mid = Math.floor((lower + upper) / 2);
                var currentElement = this.blocks[mid];
                var distance = currentElement.getBlockDistance(offs);

                if (distance == -1) {
                    upper = mid;
                }
                else {
                    lower = mid + 1;
                }
            }

            return lower - 1;
        }

        private mergeBlocks(start: number, end: number) {
            for (var i = start; i < end; i++) {
                var firstBlock = this.blocks[i];
                var secondBlock = this.blocks[i + 1];
                var mergedBlocks = firstBlock.mergeWith(secondBlock);

                if (mergedBlocks) {
                    this.blocks.splice(i, 2, mergedBlocks);
                    i--; end--;
                }
            }
        }

        public removeBlock(start: number, end: number) {
            var firstBlock = this.findFirstGreaterOrEqual(start);
            var lastBlock = this.findLastLessOrEqual(end);
            if (lastBlock == -1 || firstBlock >= this.blocks.length) {
                return false;
            }

            for (var i = firstBlock; i <= lastBlock; i++) {
                var newBlocks = <any[]>this.blocks[i].removeRange(start, end);
                if (newBlocks) {
                    this.blocks.splice.apply(this.blocks, [i, 1].concat(newBlocks));
                    if (newBlocks.length == 0) {
                        i--; lastBlock--;
                    }
                    if (newBlocks.length == 2) {
                        i++; lastBlock++;
                    }
                }
            }

            if (lastBlock == -1)
                lastBlock = 0;
            
            // Offset moving
            var prevOffset;
            if (this.blocks[lastBlock - 1])
                prevOffset = (this.blocks[lastBlock - 1].offs_end + 1)
            else
                prevOffset = 0;

            for (var i = lastBlock; i < this.blocks.length; i++) {
                var len = this.blocks[i].getLength();
                this.blocks[i].offs_start = prevOffset;
                this.blocks[i].offs_end = prevOffset + len - 1;
                prevOffset += len;
            }

            // Merging

            if (lastBlock === -1)
                lastBlock = 0;

            var indexes = [firstBlock, lastBlock].sort();

            if (indexes[0] < indexes[1])
                this.mergeBlocks(indexes[0], indexes[1]);
        }

        public insertBlock(block: IDataBlock) {
            var place = block.offs_start;
            var placeIndex = this.findBlock(place);

            if (placeIndex === -1) {
                placeIndex = this.findFirstGreaterOrEqual(place);
                this.blocks.splice(placeIndex, 0, block);
            } else {
                var splittedBlocks = this.blocks[placeIndex].split(place);
                var pIndex = placeIndex;
                if (splittedBlocks === null)
                    splittedBlocks = [block, this.blocks[placeIndex]];
                else {
                    splittedBlocks = [splittedBlocks[0], block, splittedBlocks[1]];
                    placeIndex++;
                }
                this.blocks.splice.apply(this.blocks, [pIndex, 1].concat(<any[]>(splittedBlocks)));
            }
            
            // Offset moving
            var prevOffset = this.blocks[placeIndex].offs_end + 1;

            for (var i = placeIndex + 1; i < this.blocks.length; i++) {
                var len = this.blocks[i].getLength();
                this.blocks[i].offs_start = prevOffset;
                this.blocks[i].offs_end = prevOffset + len - 1;
                prevOffset += len;
            }
            
            // Merging
            var firstIndex = placeIndex - 1;
            var secondIndex = placeIndex + 1;

            if (firstIndex < 0)
                firstIndex = 0;
            if (secondIndex >= this.blocks.length)
                secondIndex = this.blocks.length - 1;

            if (firstIndex < secondIndex)
                this.mergeBlocks(firstIndex, secondIndex);
        }

        public readBlocks(offset: number, length: number): IDataBlock[] {
            var firstBlockIndex = this.findBlock(offset);
            var lastBlockIndex = this.findBlock(offset + length - 1);

            if (firstBlockIndex === -1)
                return [];
            if (lastBlockIndex === -1)
                lastBlockIndex = this.blocks.length - 1;

            var blocks = this.blocks.slice(firstBlockIndex, lastBlockIndex + 1);

            blocks[0] = blocks[0].slice(offset, blocks[0].offs_end);
            blocks[blocks.length - 1] = blocks[blocks.length - 1].slice(
                blocks[blocks.length - 1].offs_start, offset + length - 1);
            return blocks;
        }

        public print() {
            for (var block of this.blocks) {
                console.log(block.toString());
            }
        }
    }
}