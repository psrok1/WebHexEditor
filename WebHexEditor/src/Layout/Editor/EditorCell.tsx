import * as React from "react";
import { FileByte, FileByteSpecial } from "../../Datastore/FileContext";
import { Converters } from "../../Converters.ts"

export interface EditorCellDescriptor {
    cellOffset: number;
    ascii: boolean;
}

export interface MouseCellEvent extends MouseEvent {
    cell: EditorCellDescriptor;
}

interface EditorCellProps {
    value: number;
    cellOffset?: number;

    color?: string;
    partial?: boolean;       // during modification
    selected?: boolean;
    ascii?: boolean;         // ascii cells

    onMouseDown?: (ev: MouseCellEvent) => any;
    onMouseUp?: (ev: MouseCellEvent) => any;
    onMouseOver?: (ev: MouseCellEvent) => any;
    onMouseOut?: (ev: MouseCellEvent) => any;
}

function byteToString(b: FileByte): string {
    if (b == FileByteSpecial.PENDING)
        return "??";
    else if (b == FileByteSpecial.EOF)
        return "\u00a0\u00a0";
    else
        return Converters.hexWithPad(b, 2);
}

export default class EditorCell extends React.Component<EditorCellProps, {}> {

    private onMouseEvent(cb: (ev: MouseCellEvent) => any, ev: MouseEvent) {
        var cellEvent: MouseCellEvent = ev as MouseCellEvent;
        cellEvent.cell = {
            cellOffset: this.props.cellOffset,
            ascii: this.props.ascii
        };

        if (cb)
            cb(cellEvent);
    }

    render() {
        var val: string;

        if (this.props.value == null)
            val = "\u00a0" + (this.props.ascii ? "" : "\u00a0");
        else if (this.props.partial)
            val = this.props.ascii ? "." : (byteToString(this.props.value)[0] + "_");
        else
            val = this.props.ascii ? Converters.byteToAscii(this.props.value) : byteToString(this.props.value);

        return (
            <div
                className={"editor-cell " +
                    (this.props.ascii
                        ? "editor-ascii-cell"
                        : "editor-byte-cell") }
                onMouseDown = {this.onMouseEvent.bind(this, this.props.onMouseDown) }
                onMouseUp   = {this.onMouseEvent.bind(this, this.props.onMouseUp) }
                onMouseOver = { this.onMouseEvent.bind(this, this.props.onMouseOver) }
                onMouseOut  = { this.onMouseEvent.bind(this, this.props.onMouseOut) }
                style = {{
                    color: this.props.color,
                    backgroundColor: this.props.selected ? "lightskyblue" : null
                }}>
                {val}
            </div>);
    }
}