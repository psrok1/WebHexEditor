import * as React from "react";
import { GLComponentProps } from "./Base.tsx"

interface EditorProps extends GLComponentProps {
    file: File;
}

enum InteractivityState {
    Initializing,
    HardWaiting,
    SoftWaiting,
    Ready
}

interface EditorState {
    interactivity?: InteractivityState;
}

export class Editor extends React.Component<EditorProps, EditorState> {
    constructor() {
        super()
        this.state = {
            interactivity: InteractivityState.Initializing
        };
    }

    render() {
        return (<div>
            <h1>{this.props.file.name}</h1>
        </div>)
    }
}