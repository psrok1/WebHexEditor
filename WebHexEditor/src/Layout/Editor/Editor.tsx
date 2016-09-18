import * as React from "react";
import { AutoSizer, VirtualScroll } from "react-virtualized"
import FileContext, { FileRow } from "../../Datastore/FileContext"
import EditorRow from "./EditorRow"
import EditorScrollbox from "./EditorScrollbox"

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

    private renderRow(index: number): JSX.Element {
        var row: FileRow = this.fileContext.readRow(index, 16);
        if (row.fileData && !row.fileData.complete &&
            this.state.interactivity !== InteractivityState.SoftWaiting)
        {
            /**
             * React forbids state setting during render, so we'll just do it
             * immediately after.
             */
            setTimeout(() => this.setState({ interactivity: InteractivityState.SoftWaiting }), 0);
        }

        return (<EditorRow key={index} row={row} />)
    }

    render() {
        return (
            <AutoSizer>
                {(dimensions: { width: number, height: number }) =>
                    (<div className="editor" style={{position: "relative"}}>
                        <EditorScrollbox
                            width={dimensions.width}
                            height={dimensions.height}
                            rowCount={this.fileContext.getNumberOfRows() }
                            rowRenderer={ this.renderRow.bind(this) } 
                            rowHeight={16}
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