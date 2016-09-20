import GoldenLayout = require("golden-layout");

import { Hello } from "./Hello";
import { Editor } from "./Editor/Editor";

/***
 * This interface should be inherited by all props interfaces of main layout components
 ***/
export interface GLComponentProps {
    glContainer: GoldenLayout.Container;
    glEventHub: GoldenLayout.EventEmitter;
}

let layoutConfig: GoldenLayout.Config = {
    content: [
        {
            type: 'row',
            content: [
                {
                    type: 'react-component',
                    component: 'Hello',
                    props: {
                        compiler: "A",
                        framework: "Framework"
                    }
                },
                {
                    type: 'column',
                    content: [
                        {
                            type: 'react-component',
                            component: 'Hello',
                            props: {
                                compiler: "B",
                                framework: "Framework"
                            }
                        },
                        {
                            type: 'react-component',
                            component: 'Hello',
                            props: {
                                compiler: "C",
                                framework: "Framework"
                            }
                        }
                    ]
                }
            ]
        }
    ]
}

export var layout: GoldenLayout = null;

export function initLayout(container: HTMLElement) {
    console.log(container);
    layout = new GoldenLayout(layoutConfig, container);

    layout.registerComponent("Hello", Hello);
    layout.registerComponent("Editor", Editor);
    layout.init();

    window.addEventListener("resize", (ev: UIEvent) => {
        layout.updateSize(); 
    });
}
