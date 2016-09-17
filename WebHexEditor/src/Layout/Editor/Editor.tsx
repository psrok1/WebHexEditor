import * as React from "react";
import { AutoSizer, VirtualScroll } from "react-virtualized"
import FileContext, { FileRow } from "../../Datastore/FileContext"
import EditorRow from "./EditorRow"

import { GLComponentProps } from "../Base"

interface EditorProps extends GLComponentProps {
    file: File;
}

enum InteractivityState {
    Initializing = 0,
    HardWaiting  = 1,
    SoftWaiting  = 2,
    Ready        = 3
}

interface EditorState {
    interactivity?: InteractivityState;
}

export class Editor extends React.Component<EditorProps, EditorState> {
    private fileContext: FileContext;

    constructor(props: EditorProps) {
        super();
        this.state = {
            interactivity: InteractivityState.Initializing
        };
        this.fileContext = new FileContext(
            props.file,
            // onInitialized
            () => {
                this.setState({ interactivity: InteractivityState.Ready });
            },
            // onUpdate
            () => {
                this.setState({ interactivity: InteractivityState.Ready });
            });
    }

    private renderRow(params: { index: number }) {
        var row: FileRow = this.fileContext.readRow(params.index, 16);
        if (row.fileData && !row.fileData.complete)
            this.setState({interactivity: InteractivityState.SoftWaiting });

        return (<EditorRow row={row} /> )
    }

    render() {
        return (
            <AutoSizer>
                {(dimensions: { width: number, height: number }) =>
                    (<div style={{position: "relative"}}>
                        <VirtualScroll
                            style = {{ backgroundColor: "white", color: "black" }}
                            width = {dimensions.width}
                            height = {dimensions.height}
                            overscanRowCount = {30}
                            noRowsRenderer = {() => (<div>No rows</div>) }
                            rowRenderer = { this.renderRow.bind(this) }
                            rowHeight = { 30 }
                            rowCount = { this.fileContext.getNumberOfRows() }
                            />
                        <div style={{
                            position: "absolute",
                            width: dimensions.width,
                            height: dimensions.height,
                            top: "0px",
                            display: (this.state.interactivity <= InteractivityState.HardWaiting)
                                ? "block" : "none"
                        }}>WAIT...</div>
                    </div>) }
            </AutoSizer>
        )
    }
}