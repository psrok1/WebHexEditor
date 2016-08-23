module Editor {
    // What's we need?
    // We need rows!
    // We need cells!!
    // We need popup menus!!!

    export class Editor {
        private renderer: HTMLElement;
        private file: Datastore.FileContext;
        private selection;

        private update() {
            // Content update

            // Sets editor into "pending" state
            // Checks whether current row no isn't out of range
            // Checks needed number of rows
            // Read rows from file
            // Sets scrollbar
            // Creates row and cell objects
            // Sets editor into "ready" state
        }

        private render() {
            // Rendering all elements depending on state
        }

        private setInteractivity(enable: boolean) {
            // Sets/resets event handlers
        }

        private moveToTargetField(x: number, y: number) {
            // Minimum scroll needed to reach specified field
        }

        constructor(renderer: HTMLElement, file: Datastore.FileContext) {
            this.renderer = renderer;
            this.file = file;

            // Some initializations and drawings?
        }
    }
}