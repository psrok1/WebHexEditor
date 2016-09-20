import * as React from "react";
import FileContext, { FileRow } from "../../Datastore/FileContext"
import EditorRow from "./EditorRow"
import EditorScrollbox from "./EditorScrollbox"
import EditorOverlay from "./EditorOverlay"
import { MouseCellEvent } from "./EditorCell"
import { Events } from "../../Events"

import { GLComponentProps } from "../Base"

const EditorRowHeight = 22;

interface EditorProps extends GLComponentProps {
    file: File;
}

enum InteractivityState {
    HardWaiting  = 1,
    SoftWaiting  = 2,
    Ready        = 3
}

interface EditorState {
    interactivity?: InteractivityState;
    waitingTitle?: string;
    waitingProgress?: number;

    scrollPos?: number;
    visibleRows?: number;
    dimensions?: {
        height: number;
        width: number;
    }

    selectionStart?: number;
    selectionEnd?: number;
    selectionMouseDown?: boolean;

    insertionMode?: boolean;
    partialEdit?: number;

    asciiMode?: boolean;
}

export default class Editor extends React.Component<EditorProps, EditorState> {
    private fileContext: FileContext;

    constructor(props: EditorProps) {
        super();
        this.state = {
            interactivity: InteractivityState.HardWaiting,
            waitingTitle: "Loading file...",
            waitingProgress: null,
            selectionStart: null,
            selectionEnd: null,
            dimensions: {
                width: 0,
                height: 0
            },
            scrollPos: 0,
            visibleRows: null,
            insertionMode: false,
            partialEdit: null,
            asciiMode: false
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

    /*** RESIZE ***/
    private onResize() {
        var dimensions = {
            height: this.props.glContainer.height,
            width: this.props.glContainer.width
        };
        this.setState({
            visibleRows: Math.ceil(dimensions.height / EditorRowHeight),
            dimensions: dimensions
        });
    }

    /*** SELECTION ***/

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

    private cancelSelection() {
        Events.forgetFocus();
        this.setState({
            selectionStart: null,
            selectionEnd: null,
            partialEdit: null
        });
    }

    private onScroll(index: number) {
        index = Math.max(0, index);
        index = Math.min(this.fileContext.getNumberOfRows() - 1, index);
        this.setState({ scrollPos: index });
    }

    private focusScroll(offs: number) {
        var scrollTo = this.state.scrollPos;
        var coords = this.fileContext.getByteCoordinates(offs);

        if (coords.row < this.state.scrollPos)
            scrollTo = coords.row;
        if (coords.row >= (this.state.scrollPos + this.state.visibleRows))
            scrollTo = coords.row - this.state.visibleRows + 1;

        if (scrollTo != this.state.scrollPos)
            this.setState({ scrollPos: scrollTo });
    }

    private moveSelection(moveOffset: number, expand: boolean = false) {
        // Nothing to move?
        if (this.state.selectionStart === null)
            return;

        var s: number;

        if (expand) {
            // Expanding selection
            s = Math.min(this.fileContext.getFileSize(),
                Math.max(0, this.state.selectionEnd + moveOffset));
            this.focusScroll(s);
            this.setState({
                selectionEnd: s,
                partialEdit: null
            });
        } else {
            // Selecting next row
            s = (moveOffset < 0 ? Math.min : Math.max)(this.state.selectionStart, this.state.selectionEnd);
            s = Math.min(this.fileContext.getFileSize(),
                Math.max(0, s + moveOffset));
            this.focusScroll(s);
            this.setState({
                selectionStart: s,
                selectionEnd: s,
                partialEdit: null
            });
        }
    }

    /*** KEYBOARD EVENTS ***/
    // Returns true if handled, false otherwise
    private onEditKeyDown(ev: KeyboardEvent): boolean {
        // Only one byte selected?
        if (this.state.selectionStart === null ||
            this.state.selectionMouseDown ||
            this.state.selectionStart !== this.state.selectionEnd)
            return false;

        // Interactivity enabled?
        if (this.state.interactivity !== InteractivityState.Ready)
            return false;

        // Not a special char?
        if (ev.key.length != 1)
            return false;

        var byte: number = null;

        this.focusScroll(this.state.selectionStart);

        if (this.state.asciiMode) {
            byte = ev.key.charCodeAt(0);

            // Has printable code?
            if (byte < 32 || byte > 126)
                return false;
        } else {
            byte = "0123456789ABCDEF".indexOf(ev.key[0].toUpperCase());

            // In hex-set?
            if (byte < 0)
                return false;

            console.log(byte);

            if (!this.state.partialEdit) {
                // First nibble?
                // Set it and wait for more
                if (this.state.insertionMode)
                    this.fileContext.insertBytes(this.state.selectionStart, [byte << 4]);
                this.setState({ partialEdit: byte });
                return true;
            }

            // Second nibble
            byte = (this.state.partialEdit << 4) + byte;
        }

        // It's great time to write it to file!
        if (this.state.insertionMode && this.state.asciiMode)
            this.fileContext.insertBytes(this.state.selectionStart, [byte]);
        else
            this.fileContext.overwriteBytes(this.state.selectionStart, [byte]);

        this.moveSelection(1);
        return true;
    }

    private onKeyDown(ev: KeyboardEvent) {
        switch (ev.key) {
            case "ArrowDown":
                this.moveSelection(16, ev.shiftKey);
                break;
            case "ArrowUp":
                this.moveSelection(-16, ev.shiftKey);
                break;
            case "ArrowLeft":
                this.moveSelection(-1, ev.shiftKey);
                break;
            case "ArrowRight":
                this.moveSelection(1, ev.shiftKey);
                break;
            case "Escape":
                this.cancelSelection();
                break;
            case "Tab":
                if(this.state.selectionStart !== null)
                    this.setState({
                        asciiMode: !this.state.asciiMode,
                        partialEdit: null
                    });
                break;
            case "Insert":
                if (this.state.selectionStart !== null)
                    this.setState({
                        insertionMode: !this.state.insertionMode,
                        partialEdit: null
                    });
                break;
            default:
                this.onEditKeyDown(ev);
                return;
        }

        ev.preventDefault();
    }

    /*** FOCUS EVENTS ***/

    private onFocusStolenCallback: EventListener = this.onFocusStolen.bind(this);
    private onKeyDownCallback: EventListener = this.onKeyDown.bind(this);

    private onFocusStolen(ev: CustomEvent) {
        if (ev.detail === this) {
            window.addEventListener("keydown", this.onKeyDownCallback);
        } else {
            window.removeEventListener("keydown", this.onKeyDownCallback);
            this.cancelSelection();
        }
    }

    componentWillMount() {
        window.addEventListener("focusStolen", this.onFocusStolenCallback);
        this.props.glContainer.on("resize", this.onResize.bind(this));
    }

    componentWillUnmount() {
        window.removeEventListener("focusStolen", this.onFocusStolenCallback);
    }

    /*** MOUSE EVENTS ***/

    private onCellMouseDown(ev: MouseCellEvent) {
        var that = this;
        if (ev.button == 0) { // Left button
            Events.stealFocus(this);
            if (ev.shiftKey && this.state.selectionStart !== null) {
                this.setState({
                    selectionEnd: ev.cell.cellOffset,
                    selectionMouseDown: true,
                    asciiMode: ev.cell.ascii,
                    partialEdit: null
                });
            } else {
                this.setState({
                    selectionStart: ev.cell.cellOffset,
                    selectionEnd: ev.cell.cellOffset,
                    selectionMouseDown: true,
                    asciiMode: ev.cell.ascii,
                    partialEdit: null
                });
            }

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
        this.cancelSelection();
        ev.preventDefault();
    }

    /*** RENDERING ***/
    private waitingForData: boolean = false;

    private renderRow(index: number): JSX.Element {
        var row: FileRow = this.fileContext.readRow(index, 16);
        var selectionRange = this.getSelectionRangeForRow(row);

        if (!this.waitingForData && row.fileData && !row.fileData.complete &&
            this.state.interactivity !== InteractivityState.SoftWaiting)
        {
            /**
             * React forbids state setting during render, so we'll just do it
             * immediately after.
             */
            this.waitingForData = true;
            setTimeout(() => {
                this.setState({ interactivity: InteractivityState.SoftWaiting })
                this.waitingForData = false;
            }, 0);
        }

        return (<EditorRow
            key={index}
            row={row}
            selectionColumnStart={selectionRange ? selectionRange.start : null}
            selectionColumnEnd={selectionRange ? selectionRange.end : null}
            onCellMouseDown={this.onCellMouseDown.bind(this) }
            onCellMouseOver={this.onCellMouseOver.bind(this) }
            insertionMode = {this.state.insertionMode}
            partialEdit = { this.state.partialEdit }
            asciiMode = {this.state.asciiMode} />)
    }

    render() {
        return (
            <div className="editor"
                style={{ position: "relative" }}
                onMouseDown={ this.onEditorMouseDown.bind(this) } >
                <EditorScrollbox
                    width={this.state.dimensions.width}
                    height={this.state.dimensions.height}
                    rowCount={this.fileContext.getNumberOfRows() }
                    rowRenderer={ this.renderRow.bind(this) }
                    rowHeight={EditorRowHeight}
                    scrollTo={this.state.scrollPos}
                    doScroll={ this.onScroll.bind(this) }
                    />
                <EditorOverlay
                    visible={this.state.interactivity == InteractivityState.HardWaiting}
                    width={this.state.dimensions.width}
                    height={this.state.dimensions.height}
                    label={this.state.waitingTitle}
                    progress={this.state.waitingProgress}
                    />
            </div>);
    }
}