module DatastoreWorker {
    var undoStack: BasicOperation[] = [];
    var redoStack: BasicOperation[] = [];

    function processRequest(e: MessageEvent) {
        /* INIT */
        /* UNDO */
        /* REDO */
        /* STOP: <stopping and self.close()> */
    }
    
    /* Initialization code */
    self.addEventListener('message', processRequest, false);
}