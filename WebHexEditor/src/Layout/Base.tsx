import GoldenLayout = require("golden-layout");

/***
 * This interface should be inherited by all props interfaces of main layout components
 ***/
export interface GLComponentProps {
    glContainer: GoldenLayout.Container;
    glEventHub: GoldenLayout.EventEmitter;
}