/**
 * Main DatastoreWorker module file
 * Request handlers
 */
module DatastoreWorker {
    /**
     * Undo/Redo operation stacks
     */
    const OPERATION_STACK_SIZE = 20;
    var undoStack: BasicOperation[] = [];
    var redoStack: BasicOperation[] = [];

    /**
     * Internal function: add operation onto stack
     * @param stack
     * @param element Operation object to add
     */
    function addOntoStack(stack: BasicOperation[], element: BasicOperation) {
        if (stack.length >= OPERATION_STACK_SIZE)
            stack.splice(0, 1);
        stack.push(element);
    }

    /**
     * DatastoreWorker request processor class
     */
    class RequestProcessor extends MessageProcessor {
        protected onInitializeRequest(request: InitializeRequest) {
            // Init data source object
            DataSource.init(request.source);
            // Send response: success!
            self.postMessage(new SuccessResponse());
        }

        protected onUndoRequest(request: UndoRequest) {
            var undoOperation = undoStack.pop();
            if (!undoOperation)
                self.postMessage(new ErrorResponse(ErrorResponseType.NoMoreOperationsOnStack));
            else {
                undoOperation.undo();
                addOntoStack(redoStack, undoOperation);
                self.postMessage(new SuccessResponse());
            }
        }

        protected onRedoRequest(request: RedoRequest) {
            var redoOperation = redoStack.pop();
            if (!redoOperation)
                self.postMessage(new ErrorResponse(ErrorResponseType.NoMoreOperationsOnStack));
            else {
                redoOperation.do();
                addOntoStack(undoStack, redoOperation);
                self.postMessage(new SuccessResponse());
            }
        }

        protected onCloseRequest(request: CloseRequest) {
            self.close();
        }

        protected onInsertRequest(request: InsertRequest) {
            var operation = new InsertOperation(request.offset, request.data);
            operation.do();
            addOntoStack(undoStack, operation);
            self.postMessage(new SuccessResponse(DataSource.dataBlocks.getSize()));
        }

        protected onOverwriteRequest(request: OverwriteRequest) {
            var operation = new OverwriteOperation(request.offset, request.data);
            operation.do();
            addOntoStack(undoStack, operation);
            self.postMessage(new SuccessResponse(DataSource.dataBlocks.getSize()));
        }

        protected onRemoveRequest(request: RemoveRequest) {
            var operation = new RemoveOperation(request.offset, request.length);
            operation.do();
            addOntoStack(undoStack, operation);
            self.postMessage(new SuccessResponse(DataSource.dataBlocks.getSize()));
        }

        protected onReadRequest(request: ReadRequest) {
            console.time("READING BYTES");
            DataSource.readBytes(request.offset, request.length,
                function (offs: number, data: number[]) {
                    console.timeEnd("READING BYTES");
                    self.postMessage(new ReadResponse(offs, data));
                });
        }
    }

    /**
     * Creation of RequestProcessor instance
     */
    var requestProcessor = new RequestProcessor();
    
    /* Register event handler: request receiving and processing */
    self.addEventListener('message', (ev: MessageEvent) => {
        var message: DatastoreWorker.Message = ev.data;
        requestProcessor.process(message);
    }, false);
}