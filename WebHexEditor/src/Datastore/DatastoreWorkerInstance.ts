import DatastoreWorker = require("./DatastoreWorkerRequest.ts");

export type ResponseHandler = (ev: MessageEvent) => any;

declare function require(path: string): any;

interface PendingRequest {
    request: DatastoreWorker.Message;
    responseHandler: ResponseHandler;
}

export default class WorkerInstance {
    private worker: Worker;
    private requestQueue: PendingRequest[] = [];

    private processNextRequest() {
        if (this.requestQueue.length === 0)
            return;
        var nextRequest = this.requestQueue[0];
        this.worker.postMessage(nextRequest.request);
    }

    private handleResponse(ev: MessageEvent) {
        var currentRequest = this.requestQueue.splice(0, 1)[0];
        this.processNextRequest();
        currentRequest.responseHandler(ev);
    }

    constructor(source: File, onInitialized: () => any) {
        this.worker = new Worker("datastore.js");
        this.worker.onmessage = this.handleResponse.bind(this);
        this.sendRequest(
            /* request */
            new DatastoreWorker.InitializeRequest(source),
            /* responseHandler */
            (ev) => {
                onInitialized();
            }
        );
    }

    sendRequest(request: DatastoreWorker.Message, responseHandler: ResponseHandler) {
        this.requestQueue.push({
            request: request,
            responseHandler: responseHandler
        });
        if (this.requestQueue.length === 1)
            this.processNextRequest();
    }
}