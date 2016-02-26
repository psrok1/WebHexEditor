module Datastore {
    export class FileContext {
        private datastoreWorker: Worker;

        private selection;
        private sections;
        private fields;

        constructor(source: File, onLoad: () => any) {
            this.datastoreWorker.onmessage = () => {
                onLoad();
            }
            this.datastoreWorker.postMessage(
                new DatastoreWorker.InitializeRequest(source)
            );
        }

        public read(offset: number, length: number, onSuccess: (offset: number, data: number[]) => any) {
            this.datastoreWorker.onmessage = (e: MessageEvent) => {
                var response: DatastoreWorker.ReadResponse = e.data;
                onSuccess(response.offset, response.data);
            }
            this.datastoreWorker.postMessage(
                new DatastoreWorker.ReadRequest(offset, length)
            );
        }
    }
}