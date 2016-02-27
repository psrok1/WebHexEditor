/**
 * DatastoreWorker message types and definitions
 * Defines interface between client (hex editor) and worker
 */
module DatastoreWorker {
    export enum MessageType {
        InitializeRequest,  // Applies data object to worker
        UndoRequest,        // Undoing last operation
        RedoRequest,        // Redoing last undoed operation
        CloseRequest,       // Terminating worker

        InsertRequest,      // Inserts bytes into file
        OverwriteRequest,   // Overwrites bytes in file
        RemoveRequest,      // Removes bytes from files

        ReadRequest,        // Reads data block from file

        SuccessResponse,    // Operation completed successfully
        ErrorResponse,      // Error occured
        ReadResponse        // Read operation completed
    }

    export abstract class Message {
        type: MessageType;

        constructor(type: MessageType) {
            this.type = type;
        }
    }

    export abstract class MessageProcessor {
        protected onInitializeRequest(request: InitializeRequest) { }
        protected onUndoRequest(request: UndoRequest) { }
        protected onRedoRequest(request: RedoRequest) { }
        protected onCloseRequest(request: CloseRequest) { }

        protected onInsertRequest(request: InsertRequest) { }
        protected onOverwriteRequest(request: OverwriteRequest) { }
        protected onRemoveRequest(request: RemoveRequest) { }
        
        protected onReadRequest(request: ReadRequest) { }
        
        protected onSuccessResponse(response: SuccessResponse) { }
        protected onErrorResponse(response: ErrorResponse) { }
        protected onReadResponse(response: ReadResponse) { }

        /**
         * Translates message and calls suitable processing method
         * @param message Message object
         */
        process(message: Message) {
            switch (message.type) {
                case MessageType.InitializeRequest:
                    return this.onInitializeRequest(<InitializeRequest>message);
                case MessageType.UndoRequest:
                    return this.onUndoRequest(<UndoRequest>message);
                case MessageType.RedoRequest:
                    return this.onRedoRequest(<RedoRequest>message);
                case MessageType.CloseRequest:
                    return this.onCloseRequest(<CloseRequest>message);
                case MessageType.InsertRequest:
                    return this.onInsertRequest(<InsertRequest>message);
                case MessageType.OverwriteRequest:
                    return this.onOverwriteRequest(<OverwriteRequest>message);
                case MessageType.RemoveRequest:
                    return this.onRemoveRequest(<RemoveRequest>message);
                case MessageType.ReadRequest:
                    return this.onReadRequest(<ReadRequest>message);
                case MessageType.SuccessResponse:
                    return this.onSuccessResponse(<SuccessResponse>message);
                case MessageType.ErrorResponse:
                    return this.onErrorResponse(<ErrorResponse>message);
                case MessageType.ReadResponse:
                    return this.onReadResponse(<ReadResponse>message);
            }
        }
    }

    export enum ErrorResponseType {
        NoMoreOperationsOnStack
    }

    export class InitializeRequest extends Message {
        source: File;

        constructor(source: File) {
            super(MessageType.InitializeRequest);
            this.source = source;
        }
    }

    export class UndoRequest extends Message {
        constructor() {
            super(MessageType.UndoRequest);
        }
    }

    export class RedoRequest extends Message {
        constructor() {
            super(MessageType.RedoRequest);
        }
    }

    export class CloseRequest extends Message {
        constructor() {
            super(MessageType.CloseRequest);
        }
    }

    export class InsertRequest extends Message {
        offset: number;
        data: number[];

        constructor(offset: number, data: number[]) {
            super(MessageType.InsertRequest);
            this.offset = offset;
            this.data = data;
        }
    }

    export class OverwriteRequest extends Message {
        offset: number;
        data: number[];

        constructor(offset: number, data: number[]) {
            super(MessageType.OverwriteRequest);
            this.offset = offset;
            this.data = data;
        }
    }

    export class RemoveRequest extends Message {
        offset: number;
        length: number;

        constructor(offset: number, length: number) {
            super(MessageType.RemoveRequest);
            this.offset = offset;
            this.length = length;
        }
    }

    export class ReadRequest extends Message {
        offset: number;
        length: number;

        constructor(offset: number, length: number) {
            super(MessageType.ReadRequest);
            this.offset = offset;
            this.length = length;
        }
    }

    export class SuccessResponse extends Message {
        private newFileSize: number;

        constructor(newFileSize: number = 0) {
            super(MessageType.SuccessResponse);
            this.newFileSize = newFileSize;
        }        
    }

    export class ErrorResponse extends Message {
        errorType: ErrorResponseType;

        constructor(responseType: ErrorResponseType) {
            super(MessageType.ErrorResponse);
            this.errorType = responseType;
        }
    }

    export class ReadResponse extends Message {
        offset: number;
        data: number[];

        constructor(offset: number, data: number[]) {
            super(MessageType.ReadResponse);
            this.offset = offset;
            this.data = data;
        }
    }
}