module DatastoreWorker {
    export abstract class BasicOperation {
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

    export class InsertOperation extends BasicOperation {
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

    export class RemoveOperation extends BasicOperation {
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

    export class OverwriteOperation extends BasicOperation {
        constructor(offs: number, bytes: number[]) {
            var insertOperation = new InsertOperation(offs, bytes);
            var removeOperation = new RemoveOperation(offs, bytes.length);
            super(
                /* do */
                function () {
                    removeOperation.do();
                    insertOperation.do();
                },
                /* undo */
                function () {
                    insertOperation.undo();
                    removeOperation.undo();
                }
            );
        }
    }
}