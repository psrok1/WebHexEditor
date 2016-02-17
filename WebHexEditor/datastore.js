var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var DataManagement;
(function (DataManagement) {
    var IDataBlock = (function () {
        function IDataBlock(start, end) {
            this.offs_start = start;
            this.offs_end = end;
        }
        IDataBlock.prototype.getBlockDistance = function (offs) {
            if (offs > this.offs_end)
                return 1;
            else if (offs < this.offs_start)
                return -1;
            else
                return 0;
        };
        IDataBlock.prototype.getLength = function () {
            return this.offs_end - this.offs_start + 1;
        };
        return IDataBlock;
    })();
    DataManagement.IDataBlock = IDataBlock;
    var OriginIDataBlock = (function (_super) {
        __extends(OriginIDataBlock, _super);
        function OriginIDataBlock(start, end, o_start, o_end) {
            if (o_start === void 0) { o_start = start; }
            if (o_end === void 0) { o_end = end; }
            _super.call(this, start, end);
            this.origin_start = o_start;
            this.origin_end = o_end;
        }
        OriginIDataBlock.prototype.slice = function (start, end) {
            var ldist = start - this.offs_start;
            var rdist = this.offs_end - end;
            return new OriginIDataBlock(this.offs_start + ldist, this.offs_end - rdist, this.origin_start + ldist, this.origin_end - rdist);
        };
        OriginIDataBlock.prototype.clone = function () {
            return new OriginIDataBlock(this.offs_start, this.offs_end, this.origin_start, this.origin_end);
        };
        OriginIDataBlock.prototype.mergeWith = function (block) {
            if (!(block instanceof OriginIDataBlock))
                return null;
            var blk = (block);
            // If blk precedes "this"
            if (blk.offs_end + 1 == this.offs_start &&
                blk.origin_end + 1 == this.origin_start) {
                return new OriginIDataBlock(blk.offs_start, this.offs_end, blk.origin_start, this.origin_end);
            }
            else if (this.offs_end + 1 == blk.offs_start &&
                this.origin_end + 1 == blk.origin_start) {
                return new OriginIDataBlock(this.offs_start, blk.offs_end, this.origin_start, blk.origin_end);
            }
            else
                return null; // Can't be merged!
        };
        OriginIDataBlock.prototype.split = function (point) {
            if (point > this.offs_start && point <= this.offs_end) {
                var l_dist = this.offs_end - (point - 1);
                var r_dist = (point) - this.offs_start;
                var n_block = new OriginIDataBlock(this.offs_start + r_dist, this.offs_end, this.origin_start + r_dist, this.origin_end);
                this.offs_end -= l_dist;
                this.origin_end -= l_dist;
                return [this, n_block];
            }
            else
                return null;
        };
        OriginIDataBlock.prototype.removeRange = function (start, end) {
            /* Left or overlap cut-off */
            if (start <= this.offs_start && end >= this.offs_start) {
                var n_dist = (end + 1) - this.offs_start;
                this.offs_start = end + 1;
                if (this.offs_start <= this.offs_end) {
                    // Type-related data correction
                    this.origin_start += n_dist;
                    return [this];
                }
                else
                    return [];
            }
            else if (start > this.offs_start && start <= this.offs_end &&
                end >= this.offs_end) {
                var n_dist = this.offs_end - (start - 1);
                this.offs_end = start - 1;
                // Type-related data correction
                this.origin_end -= n_dist;
                return [this];
            }
            else if (start > this.offs_start && start < this.offs_end &&
                end > this.offs_start && end < this.offs_end) {
                var l_dist = this.offs_end - (start - 1);
                var r_dist = (end + 1) - this.offs_start;
                var n_block = new OriginIDataBlock(this.offs_start + r_dist, this.offs_end, this.origin_start + r_dist, this.origin_end);
                this.offs_end -= l_dist;
                this.origin_end -= l_dist;
                return [this, n_block];
            }
            else
                /* No cut-off */
                return null;
        };
        OriginIDataBlock.prototype.toString = function () {
            return "OriginIDataBlock[" + this.offs_start + ".." + this.offs_end + "] -> " +
                "(" + this.origin_start + ".." + this.origin_end + ")";
        };
        return OriginIDataBlock;
    })(IDataBlock);
    DataManagement.OriginIDataBlock = OriginIDataBlock;
    var ModifiedIDataBlock = (function (_super) {
        __extends(ModifiedIDataBlock, _super);
        function ModifiedIDataBlock(start, content) {
            _super.call(this, start, start + content.length - 1);
            this.content = content;
        }
        ModifiedIDataBlock.prototype.slice = function (start, end) {
            var ldist = start - this.offs_start;
            var rdist = this.offs_end - end;
            return new ModifiedIDataBlock(this.offs_start + ldist, this.content.slice(ldist, this.content.length - rdist));
        };
        ModifiedIDataBlock.prototype.clone = function () {
            return new ModifiedIDataBlock(this.offs_start, this.content.slice());
        };
        ModifiedIDataBlock.prototype.mergeWith = function (block) {
            if (!(block instanceof ModifiedIDataBlock))
                return null;
            var blk = (block);
            // If blk precedes "this"
            if (blk.offs_end + 1 == this.offs_start) {
                Array.prototype.push.apply(blk.content, this.content);
                blk.offs_end = this.offs_end;
                return blk;
            }
            else if (this.offs_end + 1 == blk.offs_start) {
                Array.prototype.push.apply(this.content, blk.content);
                this.offs_end = blk.offs_end;
                return this;
            }
            else
                return null;
        };
        ModifiedIDataBlock.prototype.split = function (point) {
            if (point > this.offs_start && point <= this.offs_end) {
                var l_dist = this.offs_end - (point - 1);
                var r_dist = (point) - this.offs_start;
                var n_block = new ModifiedIDataBlock(this.offs_start + r_dist, this.content.slice(r_dist));
                this.offs_end -= l_dist;
                this.content.splice(this.content.length - l_dist, l_dist);
                return [this, n_block];
            }
            else
                return null;
        };
        ModifiedIDataBlock.prototype.removeRange = function (start, end) {
            /* Left or overlap cut-off */
            if (start <= this.offs_start && end >= this.offs_start) {
                var n_dist = (end + 1) - this.offs_start;
                this.offs_start = end + 1;
                if (this.offs_start <= this.offs_end) {
                    // Type-related data correction
                    this.content.splice(0, n_dist);
                    return [this];
                }
                else
                    return [];
            }
            else if (start > this.offs_start && start <= this.offs_end &&
                end >= this.offs_end) {
                var n_dist = this.offs_end - (start - 1);
                this.offs_end = start - 1;
                // Type-related data correction
                this.content.splice(this.content.length - n_dist, n_dist);
                return [this];
            }
            else if (start > this.offs_start && start < this.offs_end &&
                end > this.offs_start && end < this.offs_end) {
                var l_dist = this.offs_end - (start - 1);
                var r_dist = (end + 1) - this.offs_start;
                var n_block = new ModifiedIDataBlock(this.offs_start + r_dist, this.content.slice(r_dist));
                this.offs_end -= l_dist;
                this.content.splice(this.content.length - l_dist, l_dist);
                return [this, n_block];
            }
            else
                /* No cut-off */
                return null;
        };
        ModifiedIDataBlock.prototype.toString = function () {
            return "ModifiedIDataBlock[" + this.offs_start + ".." + this.offs_end + "] -> " +
                this.content;
        };
        return ModifiedIDataBlock;
    })(IDataBlock);
    DataManagement.ModifiedIDataBlock = ModifiedIDataBlock;
})(DataManagement || (DataManagement = {}));
var DataManagement;
(function (DataManagement) {
    var IDataBlockSet = (function () {
        function IDataBlockSet(size) {
            this.blocks = [
                new DataManagement.OriginIDataBlock(0, size - 1)
            ];
        }
        IDataBlockSet.prototype.findBlock = function (offs) {
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
        };
        IDataBlockSet.prototype.findFirstGreaterOrEqual = function (offs) {
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
        };
        IDataBlockSet.prototype.findLastLessOrEqual = function (offs) {
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
        };
        IDataBlockSet.prototype.mergeBlocks = function (start, end) {
            for (var i = start; i < end; i++) {
                var firstBlock = this.blocks[i];
                var secondBlock = this.blocks[i + 1];
                var mergedBlocks = firstBlock.mergeWith(secondBlock);
                if (mergedBlocks) {
                    this.blocks.splice(i, 2, mergedBlocks);
                    i--;
                    end--;
                }
            }
        };
        IDataBlockSet.prototype.removeBlock = function (start, end) {
            var firstBlock = this.findFirstGreaterOrEqual(start);
            var lastBlock = this.findLastLessOrEqual(end);
            if (lastBlock == -1 || firstBlock >= this.blocks.length) {
                return false;
            }
            for (var i = firstBlock; i <= lastBlock; i++) {
                var newBlocks = this.blocks[i].removeRange(start, end);
                if (newBlocks) {
                    this.blocks.splice.apply(this.blocks, [i, 1].concat(newBlocks));
                    if (newBlocks.length == 0) {
                        i--;
                        lastBlock--;
                    }
                    if (newBlocks.length == 2) {
                        i++;
                        lastBlock++;
                    }
                }
            }
            if (lastBlock == -1)
                lastBlock = 0;
            // Offset moving
            var prevOffset;
            if (this.blocks[lastBlock - 1])
                prevOffset = (this.blocks[lastBlock - 1].offs_end + 1);
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
        };
        IDataBlockSet.prototype.insertBlock = function (block) {
            var place = block.offs_start;
            var placeIndex = this.findBlock(place);
            if (placeIndex === -1) {
                placeIndex = this.findFirstGreaterOrEqual(place);
                this.blocks.splice(placeIndex, 0, block);
            }
            else {
                var splittedBlocks = this.blocks[placeIndex].split(place);
                var pIndex = placeIndex;
                if (splittedBlocks === null)
                    splittedBlocks = [block, this.blocks[placeIndex]];
                else {
                    splittedBlocks = [splittedBlocks[0], block, splittedBlocks[1]];
                    placeIndex++;
                }
                this.blocks.splice.apply(this.blocks, [pIndex, 1].concat((splittedBlocks)));
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
        };
        IDataBlockSet.prototype.readBlocks = function (offset, length) {
            var firstBlockIndex = this.findBlock(offset);
            var lastBlockIndex = this.findBlock(offset + length - 1);
            if (firstBlockIndex === -1)
                return [];
            if (lastBlockIndex === -1)
                lastBlockIndex = this.blocks.length - 1;
            var blocks = this.blocks.slice(firstBlockIndex, lastBlockIndex + 1);
            blocks[0] = blocks[0].slice(offset, blocks[0].offs_end);
            blocks[blocks.length - 1] = blocks[blocks.length - 1].slice(blocks[blocks.length - 1].offs_start, offset + length - 1);
            return blocks;
        };
        IDataBlockSet.prototype.print = function () {
            for (var _i = 0, _a = this.blocks; _i < _a.length; _i++) {
                var block = _a[_i];
                console.log(block.toString());
            }
        };
        return IDataBlockSet;
    })();
    DataManagement.IDataBlockSet = IDataBlockSet;
})(DataManagement || (DataManagement = {}));
var DataManagement;
(function (DataManagement) {
    var DataSource = (function () {
        function DataSource(source) {
            this.fileReader = new FileReader();
            this.fileObject = source;
            this.dataBlocks = new DataManagement.IDataBlockSet(source.size);
        }
        DataSource.prototype.readBytes = function (offs, len, cbreader) {
            var _this = this;
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
            var OriginToResolve = (function () {
                function OriginToResolve(block) {
                    this.origin_start = block.origin_start;
                    this.origin_end = block.origin_end;
                    this.origin_blocks = [block];
                }
                OriginToResolve.prototype.isBlockNear = function (block) {
                    return (block.origin_start - this.origin_end) <= 128;
                };
                // Assumes that blocks will be pushed sequentially
                OriginToResolve.prototype.pushBlock = function (block) {
                    if (!this.isBlockNear(block))
                        return false;
                    this.origin_blocks.push(block);
                    this.origin_end = block.origin_end;
                    return true;
                };
                return OriginToResolve;
            })();
            // Queue of origins need to be resolved
            var originsToResolve = [];
            // Function, which resolve next origin from queue
            var resolveNextOrigin = function () {
                // Get next origin from queue
                var originBeingResolved = originsToResolve.pop();
                // If queue is empty: pass loaded data to target
                if (!originBeingResolved) {
                    cbreader(offs, data);
                    return;
                }
                // If chunk is loaded from file: process
                _this.fileReader.onloadend = function (evt) {
                    if (evt.target.readyState != 2)
                        return;
                    var originData = Array.apply([], new Uint8Array((evt.target.result)));
                    for (var _i = 0, _a = originBeingResolved.origin_blocks; _i < _a.length; _i++) {
                        var origin = _a[_i];
                        var chunkStartIdx = origin.origin_start - originBeingResolved.origin_start;
                        var chunkEndIdx = origin.origin_end - originBeingResolved.origin_start;
                        var dataChunk = originData.slice(chunkStartIdx, chunkEndIdx + 1);
                        data.splice.apply(data, [origin.offs_start - offs, 0].concat(dataChunk));
                    }
                    resolveNextOrigin();
                };
                // Start loading chunk from file
                var fileBytes = _this.fileObject.slice(originBeingResolved.origin_start, originBeingResolved.origin_end + 1);
                _this.fileReader.readAsArrayBuffer(fileBytes);
            };
            // For each block of data
            for (var _i = 0; _i < blocks.length; _i++) {
                var block = blocks[_i];
                // Determine whether content is stored locally or need to be loaded from file.
                if (block instanceof DataManagement.OriginIDataBlock) {
                    // If it's "remote": add block to queue
                    if (originsToResolve.length == 0 ||
                        !originsToResolve[originsToResolve.length - 1].pushBlock(block)) {
                        originsToResolve.push(new OriginToResolve(block));
                    }
                }
                else if (block instanceof DataManagement.ModifiedIDataBlock) {
                    // If it's "local": insert into buffer
                    data.splice.apply(data, [block.offs_start - offs, 0].concat(block.content));
                }
            }
            // Start resolving remote blocks
            resolveNextOrigin();
        };
        DataSource.prototype.insertBytes = function (offs, bytes) {
            this.dataBlocks.insertBlock(new DataManagement.ModifiedIDataBlock(offs, bytes));
        };
        DataSource.prototype.removeBytes = function (offs, length) {
            this.dataBlocks.removeBlock(offs, offs + length - 1);
        };
        DataSource.prototype.overwriteBytes = function (offs, bytes) {
            this.removeBytes(offs, bytes.length);
            this.insertBytes(offs, bytes);
        };
        return DataSource;
    })();
    DataManagement.DataSource = DataSource;
})(DataManagement || (DataManagement = {}));
/// <reference path="IDataBlock.ts" />
/// <reference path="IDataBlockSet.ts" />
/// <reference path="DataSource.ts" /> 
//# sourceMappingURL=datastore.js.map