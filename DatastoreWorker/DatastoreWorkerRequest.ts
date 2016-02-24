module DatastoreWorker {
    export interface MessageProcessor {
        processInitializeRequest?(request: InitializeRequest);
        processUndoRequest?(request: UndoRequest);
        processRedoRequest?(request: RedoRequest);
        processCloseRequest?(request: CloseRequest);

        processInsertRequest?(request: InsertRequest);
        processOverwriteRequest?(request: OverwriteRequest);
        processRemoveRequest?(request: RemoveRequest);

        processReadRequest?(request: ReadRequest);

        processSuccessResponse?(response: SuccessResponse);
        processErrorResponse?(response: ErrorResponse);
        processReadResponse?(response: ReadResponse);
    }

    export enum ErrorResponseType {
        NoMoreOperationsOnStack
    }

    export interface Message {
        accept(processor: MessageProcessor);
    }

    export class InitializeRequest implements Message {
        source: File;

        constructor(source: File) {
            this.source = source;
        }

        public accept(processor: MessageProcessor) {
            processor.processInitializeRequest(this);
        }
    }

    export class UndoRequest implements Message {
        public accept(processor: MessageProcessor) {
            processor.processUndoRequest(this);
        }
    }

    export class RedoRequest implements Message {
        public accept(processor: MessageProcessor) {
            processor.processRedoRequest(this);
        }
    }

    export class CloseRequest implements Message {
        public accept(processor: MessageProcessor) {
            processor.processCloseRequest(this);
        }
    }

    export class InsertRequest implements Message {
        offset: number;
        data: number[];

        constructor(offset: number, data: number[]) {
            this.offset = offset;
            this.data = data;
        }

        public accept(processor: MessageProcessor) {
            processor.processInsertRequest(this);
        }
    }

    export class OverwriteRequest implements Message {
        offset: number;
        data: number[];

        constructor(offset: number, data: number[]) {
            this.offset = offset;
            this.data = data;
        }

        public accept(processor: MessageProcessor) {
            processor.processOverwriteRequest(this);
        }
    }

    export class RemoveRequest implements Message {
        offset: number;
        length: number;

        constructor(offset: number, length: number) {
            this.offset = offset;
            this.length = length;
        }

        public accept(processor: MessageProcessor) {
            processor.processRemoveRequest(this);
        }
    }

    export class ReadRequest implements Message {
        offset: number;
        length: number;

        constructor(offset: number, length: number) {
            this.offset = offset;
            this.length = length;
        }

        public accept(processor: MessageProcessor) {
            processor.processReadRequest(this);
        }
    }

    export class SuccessResponse implements Message {
        public accept(processor: MessageProcessor) {
            processor.processSuccessResponse(this);
        }
    }

    export class ErrorResponse implements Message {
        type: ErrorResponseType;

        constructor(responseType: ErrorResponseType) {
            this.type = responseType;
        }

        public accept(processor: MessageProcessor) {
            processor.processErrorResponse(this);
        }
    }

    export class ReadResponse implements Message {
        offset: number;
        data: number[];

        constructor(offset: number, data: number[]) {
            this.offset = offset;
            this.data = data;
        }

        public accept(processor: MessageProcessor) {
            processor.processReadResponse(this);
        }
    }
}