module DatastoreWorker {
    class BasicOperation {
        private cbDo: Function;
        private cbUndo: Function;

        constructor(cbDo: Function, cbUndo: Function) {
            this.cbDo = cbDo;
            this.cbUndo = cbUndo;
        }

        public do() {
            this.cbDo();
        }

        public undo() {
            this.cbUndo();
        }
    }

    class InsertOperation extends BasicOperation {
        constructor(offs: number, bytes: number[]) {
            super(
                /* do */
                function () {
                    DataSource.dataBlocks.insertBlock(new ModifiedIDataBlock(offs, bytes));
                },
                /* undo */
                function () {
                    DataSource.dataBlocks.removeBlock(offs, offs + bytes.length - 1);
                }
            );
        }
    }

    class RemoveOperation extends BasicOperation {
        constructor(offs: number, length: number) {
            var removedBlocks = DataSource.dataBlocks.readBlocks(offs, length);
            super(
                /* do */
                function () {
                    DataSource.dataBlocks.removeBlock(offs, offs + length - 1);
                },
                /* undo */
                function () {
                    for (var block of removedBlocks)
                        DataSource.dataBlocks.insertBlock(block);
                }
            );
        }
    }

    class OverwriteOperation extends BasicOperation {
        constructor(offs: number, bytes: number[]) {
            var removedBlocks = DataSource.dataBlocks.readBlocks(offs, bytes.length);
            super(
                /* do */
                function () {
                    DataSource.dataBlocks.removeBlock(offs, offs + bytes.length - 1);
                    DataSource.dataBlocks.insertBlock(new ModifiedIDataBlock(offs, bytes));
                },
                /* undo */
                function () {
                    DataSource.dataBlocks.removeBlock(offs, offs + bytes.length - 1);
                    for (var block of removedBlocks)
                        DataSource.dataBlocks.insertBlock(block);
                }
            );
        }
    }
    //export function insertBytes(offs: number, bytes: number[]) {
    //    dataBlocks.insertBlock(new ModifiedIDataBlock(offs, bytes));
    //}

    //export function removeBytes(offs: number, length: number) {
    //    dataBlocks.removeBlock(offs, offs + length - 1);
    //}
            
    //export function overwriteBytes(offs: number, bytes: number[]) {
    //    removeBytes(offs, bytes.length);
    //    insertBytes(offs, bytes);
    //}
}