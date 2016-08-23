import * as React from "react";
import * as ReactDOM from "react-dom";
import { Hello } from "./Layout/Hello";
import GoldenLayout = require('golden-layout');

import FileContext from "./Datastore/FileContext.ts"

var f = new FileContext(new File([], "xdd"), () => { });

let layout = new GoldenLayout({
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
});

layout.registerComponent("Hello", Hello);
layout.init();