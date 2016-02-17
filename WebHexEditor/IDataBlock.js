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
            else if (this.offs_end + 1 == blk.offs_end) {
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
    var RLEIDataBlock = (function (_super) {
        __extends(RLEIDataBlock, _super);
        function RLEIDataBlock(start, pattern, length) {
            _super.call(this, start, start + length - 1);
            this.pattern = pattern;
            this.length = length;
        }
        RLEIDataBlock.prototype.mergeWith = function (block) {
            if (!(block instanceof RLEIDataBlock))
                return null;
            var blk = (block);
            if (blk.pattern != this.pattern)
                return null;
            // If blk precedes "this"
            if (blk.offs_end + 1 == this.offs_start) {
                blk.length += this.length;
                blk.offs_end = this.offs_end;
                return blk;
            }
            else if (this.offs_end + 1 == blk.offs_end) {
                this.length += blk.length;
                this.offs_end = blk.offs_end;
                return this;
            }
            else
                return null;
        };
        RLEIDataBlock.prototype.split = function (point) {
            if (point > this.offs_start && point <= this.offs_end) {
                var l_dist = this.offs_end - (point - 1);
                var r_dist = (point) - this.offs_start;
                var n_block = new RLEIDataBlock(this.offs_start + r_dist, this.pattern, this.length - r_dist);
                this.offs_end -= l_dist;
                this.length -= l_dist;
                return [this, n_block];
            }
            else
                return null;
        };
        RLEIDataBlock.prototype.removeRange = function (start, end) {
            /* Left or overlap cut-off */
            if (start <= this.offs_start && end >= this.offs_start) {
                var n_dist = (end + 1) - this.offs_start;
                this.offs_start = end + 1;
                if (this.offs_start <= this.offs_end) {
                    // Type-related data correction
                    this.length -= n_dist;
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
                this.length -= n_dist;
                return [this];
            }
            else if (start > this.offs_start && start < this.offs_end &&
                end > this.offs_start && end < this.offs_end) {
                var l_dist = this.offs_end - (start - 1);
                var r_dist = (end + 1) - this.offs_start;
                var n_block = new RLEIDataBlock(this.offs_start + r_dist, this.pattern, this.length - r_dist);
                this.offs_end -= l_dist;
                this.length -= l_dist;
                return [this, n_block];
            }
            else
                /* No cut-off */
                return null;
        };
        RLEIDataBlock.prototype.toString = function () {
            return "RLEIDataBlock[" + this.offs_start + ".." + this.offs_end + "] -> " +
                "[" + this.pattern + "] x " + this.length;
        };
        return RLEIDataBlock;
    })(IDataBlock);
    DataManagement.RLEIDataBlock = RLEIDataBlock;
})(DataManagement || (DataManagement = {}));
//# sourceMappingURL=IDataBlock.js.map