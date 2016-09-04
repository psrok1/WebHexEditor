import * as React from "react";
import { AutoSizer, VirtualScroll } from "react-virtualized"

import { GLComponentProps } from "../Base"

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
                    (<div style={{position: "relative"}}>
                        <VirtualScroll
                            style = {{ backgroundColor: "white" }}
                            width = {dimensions.width}
                            height = {dimensions.height}
                            overscanRowCount = {30}
                            noRowsRenderer = {() => (<div>No rows</div>) }
                            rowRenderer = {(params: { index: number }) => (<div>{params.index}</div>) }
                            rowHeight = {30}
                            rowCount = {4000}
                            />
                        <div style={{
                            position: "absolute",
                            width: dimensions.width,
                            height: dimensions.height,
                            top: "0px"
                        }}>OVERLAY
                        </div>
                    </div>) }
            </AutoSizer>
        )
    }
}