import DatastoreWorker = require("./DatastoreWorkerRequest.ts");
import WorkerInstance from "./DatastoreWorkerInstance.ts"
import DataCache from "./DataCache.ts"

export default class FileContext {
    private workerInstance: WorkerInstance;
    private dataCache: DataCache;

    private fileSize: number;

    constructor(file: File, onInitialized: () => any) {
        this.fileSize = file.size;
        this.workerInstance = new WorkerInstance(file, onInitialized);
        this.dataCache = new DataCache();
    }
}