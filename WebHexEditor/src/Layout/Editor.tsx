import * as React from "react";
import { GLComponentProps } from "./Base.tsx"

export interface EditorProps extends GLComponentProps { }
export interface EditorState { }

export class Editor extends React.Component<EditorProps, EditorState> {
    componentWillMount() {
        this.props.glContainer.on("resize", this.onresize);
    }

    componentWillUnmount() {
        this.props.glContainer.off("resize", this.onresize);
    }

    private onresize() {
        
    }

    render() {
        return (<div class="editor"></div>)
    }
}