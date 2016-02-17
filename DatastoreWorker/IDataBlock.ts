module DatastoreWorker {
    export abstract class IDataBlock {
        offs_start: number;
        offs_end: number;

        constructor(start: number, end: number) {
            this.offs_start = start;
            this.offs_end = end;
        }

        public getBlockDistance(offs: number): number {
            if (offs > this.offs_end)
                return 1;
            else if (offs < this.offs_start)
                return -1;
            else
                return 0;
        }

        public getLength(): number {
            return this.offs_end - this.offs_start + 1;
        }

        public abstract slice(start: number, end: number): IDataBlock;

        public abstract clone(): IDataBlock;

        /**************************************************************
         * Annotation: when these operations returns not-null value,  *
         *             it invalidates both argument and "this" object *
         **************************************************************/

        public abstract mergeWith(block: IDataBlock): IDataBlock;

        public abstract removeRange(start: number, end: number): IDataBlock[];

        public abstract split(point: number): IDataBlock[];

        public abstract toString(): string;
    }

    export class OriginIDataBlock extends IDataBlock {
        origin_start: number;
        origin_end: number;

        constructor(start: number, end: number, o_start: number = start, o_end: number = end) {
            super(start, end);
            this.origin_start = o_start;
            this.origin_end = o_end;
        }

        public slice(start: number, end: number): IDataBlock {
            var ldist = start - this.offs_start;
            var rdist = this.offs_end - end;
            return new OriginIDataBlock(
                this.offs_start + ldist,
                this.offs_end - rdist,
                this.origin_start + ldist,
                this.origin_end - rdist);
        }

        public clone(): IDataBlock {
            return new OriginIDataBlock(
                this.offs_start, this.offs_end,
                this.origin_start, this.origin_end);
        }

        public mergeWith(block: IDataBlock): IDataBlock {
            if (!(block instanceof OriginIDataBlock))
                return null;

            var blk = <OriginIDataBlock>(block);

            // If blk precedes "this"
            if (blk.offs_end + 1 == this.offs_start &&
                blk.origin_end + 1 == this.origin_start) {
                return new OriginIDataBlock(blk.offs_start, this.offs_end, blk.origin_start, this.origin_end);
            }
            // If blk is "this" block successor
            else if (this.offs_end + 1 == blk.offs_start &&
                this.origin_end + 1 == blk.origin_start) {
                return new OriginIDataBlock(this.offs_start, blk.offs_end, this.origin_start, blk.origin_end);
            }
            else
                return null; // Can't be merged!
        }

        public split(point: number): IDataBlock[] {
            if (point > this.offs_start && point <= this.offs_end) {
                var l_dist = this.offs_end - (point - 1);
                var r_dist = (point) - this.offs_start;

                var n_block = new OriginIDataBlock(
                    this.offs_start + r_dist, this.offs_end,
                    this.origin_start + r_dist, this.origin_end);
                this.offs_end -= l_dist;
                this.origin_end -= l_dist;
                return [this, n_block];
            } else
                return null;
        }

        public removeRange(start: number, end: number): IDataBlock[] {
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
            /* Right cut-off */
            else if (start > this.offs_start && start <= this.offs_end &&
                end >= this.offs_end) {
                var n_dist = this.offs_end - (start - 1);
                this.offs_end = start - 1;
                // Type-related data correction
                this.origin_end -= n_dist;
                return [this];
            }
            /* Middle cut-off */
            else if (
                start > this.offs_start && start < this.offs_end &&
                end > this.offs_start && end < this.offs_end) {

                var l_dist = this.offs_end - (start - 1);
                var r_dist = (end + 1) - this.offs_start;

                var n_block = new OriginIDataBlock(
                    this.offs_start + r_dist, this.offs_end,
                    this.origin_start + r_dist, this.origin_end);
                this.offs_end -= l_dist;
                this.origin_end -= l_dist;
                return [this, n_block];
            } else
                /* No cut-off */
                return null;
        }

        public toString(): string {
            return "OriginIDataBlock[" + this.offs_start + ".." + this.offs_end + "] -> " +
                "(" + this.origin_start + ".." + this.origin_end + ")";
        }
    }

    export class ModifiedIDataBlock extends IDataBlock {
        content: number[];

        constructor(start: number, content: number[]) {
            super(start, start + content.length - 1);
            this.content = content;
        }

        public slice(start: number, end: number): IDataBlock {
            var ldist = start - this.offs_start;
            var rdist = this.offs_end - end;

            return new ModifiedIDataBlock(
                this.offs_start + ldist,
                this.content.slice(ldist, this.content.length - rdist));
        }

        public clone(): IDataBlock {
            return new ModifiedIDataBlock(this.offs_start, this.content.slice());
        }

        public mergeWith(block: IDataBlock): IDataBlock {
            if (!(block instanceof ModifiedIDataBlock))
                return null;

            var blk = <ModifiedIDataBlock>(block);

            // If blk precedes "this"
            if (blk.offs_end + 1 == this.offs_start) {
                Array.prototype.push.apply(blk.content, this.content);
                blk.offs_end = this.offs_end;
                return blk;
            }
            // If "this" precedes blk
            else if (this.offs_end + 1 == blk.offs_start) {
                Array.prototype.push.apply(this.content, blk.content);
                this.offs_end = blk.offs_end;
                return this;
            } else
                return null;
        }

        public split(point: number): IDataBlock[] {
            if (point > this.offs_start && point <= this.offs_end) {
                var l_dist = this.offs_end - (point - 1);
                var r_dist = (point) - this.offs_start;

                var n_block = new ModifiedIDataBlock(
                    this.offs_start + r_dist,
                    this.content.slice(r_dist)
                );
                this.offs_end -= l_dist;
                this.content.splice(this.content.length - l_dist, l_dist);
                return [this, n_block];
            } else
                return null;
        }

        public removeRange(start: number, end: number): IDataBlock[] {
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
            /* Right cut-off */
            else if (start > this.offs_start && start <= this.offs_end &&
                end >= this.offs_end) {
                var n_dist = this.offs_end - (start - 1);
                this.offs_end = start - 1;
                // Type-related data correction
                this.content.splice(this.content.length - n_dist, n_dist);
                return [this];
            }
            /* Middle cut-off */
            else if (
                start > this.offs_start && start < this.offs_end &&
                end > this.offs_start && end < this.offs_end) {

                var l_dist = this.offs_end - (start - 1);
                var r_dist = (end + 1) - this.offs_start;

                var n_block = new ModifiedIDataBlock(
                    this.offs_start + r_dist,
                    this.content.slice(r_dist)
                );
                this.offs_end -= l_dist;
                this.content.splice(this.content.length - l_dist, l_dist);
                return [this, n_block];
            } else
                /* No cut-off */
                return null;
        }

        public toString(): string {
            return "ModifiedIDataBlock[" + this.offs_start + ".." + this.offs_end + "] -> " +
                this.content;
        }
    }

    //export class RLEIDataBlock extends IDataBlock {
    //    pattern: number;
    //    length: number;

    //    constructor(start: number, pattern: number, length: number) {
    //        super(start, start + length - 1);
    //        this.pattern = pattern;
    //        this.length = length;
    //    }

    //    public slice(start: number, end: number) {
    //        var ldist = start - this.offs_start;
    //        var rdist = this.offs_end - end;

    //        this.offs_start += ldist;
    //        this.offs_end -= rdist;

    //        this.length -= ldist + rdist;
    //    }

    //    public clone(): IDataBlock {
    //        return new RLEIDataBlock(this.offs_start, this.pattern, this.length);
    //    }

    //    public mergeWith(block: IDataBlock): IDataBlock {
    //        if (!(block instanceof RLEIDataBlock))
    //            return null;

    //        var blk = <RLEIDataBlock>(block);

    //        if (blk.pattern != this.pattern)
    //            return null;

    //        // If blk precedes "this"
    //        if (blk.offs_end + 1 == this.offs_start) {
    //            blk.length += this.length;
    //            blk.offs_end = this.offs_end;
    //            return blk;
    //        }
    //        // If "this" precedes blk
    //        else if (this.offs_end + 1 == blk.offs_start) {
    //            this.length += blk.length;
    //            this.offs_end = blk.offs_end;
    //            return this;
    //        } else
    //            return null;
    //    }

    //    public split(point: number): IDataBlock[] {
    //        if (point > this.offs_start && point <= this.offs_end) {
    //            var l_dist = this.offs_end - (point - 1);
    //            var r_dist = (point) - this.offs_start;

    //            var n_block = new RLEIDataBlock(
    //                this.offs_start + r_dist,
    //                this.pattern,
    //                this.length - r_dist
    //            );
    //            this.offs_end -= l_dist;
    //            this.length -= l_dist;
    //            return [this, n_block];
    //        } else
    //            return null;
    //    }

    //    public removeRange(start: number, end: number): IDataBlock[] {
    //        /* Left or overlap cut-off */
    //        if (start <= this.offs_start && end >= this.offs_start) {
    //            var n_dist = (end + 1) - this.offs_start;
    //            this.offs_start = end + 1;
    //            if (this.offs_start <= this.offs_end) {
    //                // Type-related data correction
    //                this.length -= n_dist;
    //                return [this];
    //            }
    //            else
    //                return [];
    //        }
    //        /* Right cut-off */
    //        else if (start > this.offs_start && start <= this.offs_end &&
    //            end >= this.offs_end) {
    //            var n_dist = this.offs_end - (start - 1);
    //            this.offs_end = start - 1;
    //            // Type-related data correction
    //            this.length -= n_dist;
    //            return [this];
    //        }
    //        /* Middle cut-off */
    //        else if (
    //            start > this.offs_start && start < this.offs_end &&
    //            end > this.offs_start && end < this.offs_end) {

    //            var l_dist = this.offs_end - (start - 1);
    //            var r_dist = (end + 1) - this.offs_start;

    //            var n_block = new RLEIDataBlock(
    //                this.offs_start + r_dist,
    //                this.pattern,
    //                this.length - r_dist
    //            );
    //            this.offs_end -= l_dist;
    //            this.length -= l_dist;
    //            return [this, n_block];
    //        } else
    //            /* No cut-off */
    //            return null;
    //    }

    //    public toString(): string {
    //        return "RLEIDataBlock[" + this.offs_start + ".." + this.offs_end + "] -> " +
    //            "[" + this.pattern + "] x " + this.length;
    //    }
    //}
}