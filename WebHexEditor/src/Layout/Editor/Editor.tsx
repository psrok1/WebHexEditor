import * as React from "react";
import { AutoSizer, VirtualScroll } from "react-virtualized"
import FileContext, { FileRow } from "../../Datastore/FileContext"
import EditorRow from "./EditorRow"
import EditorScrollbox from "./EditorScrollbox"
import { MouseCellEvent } from "./EditorCell"

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
    selectionStart?: number;
    selectionEnd?: number;
    selectionMouseDown?: boolean;
}

export class Editor extends React.Component<EditorProps, EditorState> {
    private fileContext: FileContext;

    constructor(props: EditorProps) {
        super();
        this.state = {
            interactivity: InteractivityState.Initializing,
            selectionStart: null,
            selectionEnd: null
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

    /*** MOUSE EVENTS ***/
    private onCellMouseDown(ev: MouseCellEvent) {
        var that = this;
        if (ev.button == 0) {
            // Left button
            console.log("STARTED SELECTION "+ev.cell.cellOffset);
            this.setState({
                selectionStart: ev.cell.cellOffset,
                selectionEnd: ev.cell.cellOffset,
                selectionMouseDown: true
            });

            var stopSelection = (ev: MouseEvent) => {
                that.setState({ selectionMouseDown: false });
                window.removeEventListener("mouseup", stopSelection);
            }

            window.addEventListener("mouseup", stopSelection);
            ev.preventDefault();
            // Click on the outside of cell should cancel selection
            ev.stopPropagation();
        }
    }

    private onCellMouseOver(ev: MouseCellEvent) {
        if (this.state.selectionMouseDown) {
            this.setState({
                selectionEnd: ev.cell.cellOffset
            });
            ev.preventDefault();
        }
    }

    private onEditorMouseDown(ev: MouseEvent) {
        this.setState({
            selectionStart: null,
            selectionEnd: null
        });
        ev.preventDefault();
    }

    /*** RENDERING ***/
    private getSelectionRangeForRow(row: FileRow): { start: number, end: number } {
        // Selection isn't supported for section rows
        // When nothing is selected - we also should return null
        if (row.sectionLabel ||
            this.state.selectionStart === null ||
            this.state.selectionEnd === null) 
            return null;

        var coStart = this.fileContext.getByteCoordinates(this.state.selectionStart, 16);
        var coEnd = this.fileContext.getByteCoordinates(this.state.selectionEnd, 16);

        // Sometimes selection start should be swapped with end
        if (this.state.selectionEnd < this.state.selectionStart) {
            var tmp = coStart;
            coStart = coEnd;
            coEnd = tmp;
        }

        var range = {
            start: null as number,
            end: null as number
        };

        if (coStart.row < row.rowNo)
            range.start = row.padding;
        else if (coStart.row == row.rowNo)
            range.start = coStart.column;

        if (coEnd.row > row.rowNo)
            range.end = row.padding + row.fileData.data.length;
        else if (coEnd.row == row.rowNo)
            range.end = coEnd.column;

        if (range.start === null || range.end === null)
            range = null;

        return range;
    }

    private renderRow(index: number): JSX.Element {
        var row: FileRow = this.fileContext.readRow(index, 16);
        var selectionRange = this.getSelectionRangeForRow(row);

        if (row.fileData && !row.fileData.complete &&
            this.state.interactivity !== InteractivityState.SoftWaiting)
        {
            /**
             * React forbids state setting during render, so we'll just do it
             * immediately after.
             */
            setTimeout(() => this.setState({ interactivity: InteractivityState.SoftWaiting }), 0);
        }

        return (<EditorRow
            key={index}
            row={row}
            selectionColumnStart={selectionRange ? selectionRange.start : null}
            selectionColumnEnd={selectionRange ? selectionRange.end : null}
            onCellMouseDown={this.onCellMouseDown.bind(this) }
            onCellMouseOver={this.onCellMouseOver.bind(this) } />)
    }

    render() {
        return (
            <AutoSizer>
                {(dimensions: { width: number, height: number }) =>
                    (<div
                        className="editor"
                        style={{ position: "relative" }}
                        onMouseDown={ this.onEditorMouseDown.bind(this) } >
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