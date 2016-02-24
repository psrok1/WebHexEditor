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
        class RequestProcessor implements MessageProcessor {
            processInitializeRequest(request: InitializeRequest) {
                DataSource.init(request.source);
                self.postMessage(new SuccessResponse());
            }

            processUndoRequest(request: UndoRequest) {
                var undoOperation = undoStack.pop();
                if (!undoOperation)
                    self.postMessage(new ErrorResponse(ErrorResponseType.NoMoreOperationsOnStack));
                else {
                    undoOperation.undo();
                    addIntoStack(redoStack, undoOperation);
                    self.postMessage(new SuccessResponse());
                }
            }

            processRedoRequest(request: RedoRequest) {
                var redoOperation = redoStack.pop();
                if (!redoOperation)
                    self.postMessage(new ErrorResponse(ErrorResponseType.NoMoreOperationsOnStack));
                else {
                    redoOperation.do();                    
                    addIntoStack(undoStack, redoOperation);
                    self.postMessage(new SuccessResponse());
                }
            }

            processCloseRequest(request: CloseRequest) {
                self.close();
            }

            processInsertRequest(request: InsertRequest) {
                var operation = new InsertOperation(request.offset, request.data);
                addIntoStack(undoStack, operation);
                self.postMessage(new SuccessResponse());           
            }

            processOverwriteRequest(request: OverwriteRequest) {
                var operation = new OverwriteOperation(request.offset, request.data);
                addIntoStack(undoStack, operation);
                self.postMessage(new SuccessResponse());
            }

            processRemoveRequest(request: RemoveRequest) {
                var operation = new RemoveOperation(request.offset, request.length);
                addIntoStack(undoStack, operation);
                self.postMessage(new SuccessResponse());
            }

            processReadRequest(request: ReadRequest) {
                DataSource.readBytes(request.offset, request.length,
                    function (offs: number, data: number[]) {
                        self.postMessage(new ReadResponse(offs, data));
                    });
            }
        }

        var requestProcessor = new RequestProcessor();
        var message: DatastoreWorker.Message = e.data;

        message.accept(requestProcessor);
    }
    
    /* Initialization code */
    self.addEventListener('message', processRequest, false);
}