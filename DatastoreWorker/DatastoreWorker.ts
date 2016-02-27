module DatastoreWorker {
    var undoStack: BasicOperation[] = [];
    var redoStack: BasicOperation[] = [];

    function addIntoStack(stack: BasicOperation[], element: BasicOperation) {
        var STACK_SIZE: number = 20;

        if (stack.length >= STACK_SIZE)
            stack.splice(0, 1);
        stack.push(element);
    }

    function processRequest(e: MessageEvent) {
        class RequestProcessor extends MessageProcessor {
            protected onInitializeRequest(request: InitializeRequest) {
                DataSource.init(request.source);
                self.postMessage(new SuccessResponse());
            }

            protected onUndoRequest(request: UndoRequest) {
                var undoOperation = undoStack.pop();
                if (!undoOperation)
                    self.postMessage(new ErrorResponse(ErrorResponseType.NoMoreOperationsOnStack));
                else {
                    undoOperation.undo();
                    addIntoStack(redoStack, undoOperation);
                    self.postMessage(new SuccessResponse());
                }
            }

            protected onRedoRequest(request: RedoRequest) {
                var redoOperation = redoStack.pop();
                if (!redoOperation)
                    self.postMessage(new ErrorResponse(ErrorResponseType.NoMoreOperationsOnStack));
                else {
                    redoOperation.do();                    
                    addIntoStack(undoStack, redoOperation);
                    self.postMessage(new SuccessResponse());
                }
            }

            protected onCloseRequest(request: CloseRequest) {
                self.close();
            }

            protected onInsertRequest(request: InsertRequest) {
                var operation = new InsertOperation(request.offset, request.data);
                operation.do();
                addIntoStack(undoStack, operation);
                self.postMessage(new SuccessResponse(DataSource.dataBlocks.getSize()));
            }

            protected onOverwriteRequest(request: OverwriteRequest) {
                var operation = new OverwriteOperation(request.offset, request.data);
                operation.do();
                addIntoStack(undoStack, operation);
                self.postMessage(new SuccessResponse(DataSource.dataBlocks.getSize()));
            }

            protected onRemoveRequest(request: RemoveRequest) {
                var operation = new RemoveOperation(request.offset, request.length);
                operation.do();
                addIntoStack(undoStack, operation);
                self.postMessage(new SuccessResponse(DataSource.dataBlocks.getSize()));
            }

            protected onReadRequest(request: ReadRequest) {
                DataSource.readBytes(request.offset, request.length,
                    function (offs: number, data: number[]) {
                        self.postMessage(new ReadResponse(offs, data));
                    });
            }
        }

        var requestProcessor = new RequestProcessor();
        var message: DatastoreWorker.Message = e.data;
        console.log(message);
        requestProcessor.process(message);
    }
    
    /* Initialization code */
    self.addEventListener('message', processRequest, false);
}