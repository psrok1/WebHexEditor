module DatastoreWorker {
    interface Request {
        accept(processor: RequestProcessor);
    }

    class InitializeRequest implements Request {
        source: File;

        constructor(source: File) {
            this.source = source;
        }

        accept(processor: RequestProcessor) {
            processor.processInitializeRequest(this);
        }
    }

    interface RequestProcessor {
        processInitializeRequest(request: InitializeRequest);
    }
}