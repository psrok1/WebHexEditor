import * as React from "react";
import { GLComponentProps } from "./Base.tsx"
import { AutoSizer, VirtualScroll } from "react-virtualized"

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
        return (
            <AutoSizer>
                {(dimensions: { width: number, height: number }) =>
                    (<VirtualScroll
                        width = {dimensions.width}
                        height = {dimensions.height}
                        overscanRowCount = {30}
                        noRowsRenderer = {() => (<div>No rows</div>) }
                        rowRenderer = {(params: { index: number }) => (<div>{params.index}</div>) }
                        rowHeight = {30}
                        rowCount = {4000}
                        />)}
            </AutoSizer>
        )
    }
}