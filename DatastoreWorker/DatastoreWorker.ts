module DatastoreWorker {
    var undoStack: BasicOperation[] = [];
    var redoStack: BasicOperation[] = [];

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
                    self.postMessage(new SuccessResponse());
                }
            }

            processRedoRequest(request: RedoRequest) {
                var redoOperation = redoStack.pop();
                if (!redoOperation)
                    self.postMessage(new ErrorResponse(ErrorResponseType.NoMoreOperationsOnStack));
                else {
                    redoOperation.do();
                    self.postMessage(new SuccessResponse());
                }
            }

            processCloseRequest(request: CloseRequest) {
                self.close();
            }

            processInsertRequest(request: InsertRequest) {
                var operation = new InsertOperation(request.offset, request.data);
                undoStack.push(operation);
                self.postMessage(new SuccessResponse());           
            }

            processOverwriteRequest(request: OverwriteRequest) {
                var operation = new OverwriteOperation(request.offset, request.data);
                undoStack.push(operation);
                self.postMessage(new SuccessResponse());
            }

            processRemoveRequest(request: RemoveRequest) {
                var operation = new RemoveOperation(request.offset, request.length);
                undoStack.push(operation);
                self.postMessage(new SuccessResponse());
            }
        }

        var requestProcessor = new RequestProcessor();
        var message: DatastoreWorker.Message = e.data;

        message.accept(requestProcessor);
    }
    
    /* Initialization code */
    self.addEventListener('message', processRequest, false);
}