import * as React from "react";
import { FileByte, FileByteSpecial } from "../../Datastore/FileContext";
import { Converters } from "../../Converters.ts"

interface EditorCellDescriptor {
    row: number;
    column: number;
    ascii: boolean;
}

interface MouseCellEvent extends MouseEvent {
    cell: EditorCellDescriptor;
}

interface EditorCellProps {
    row: number;
    column: number;
    value: number;

    color?: string;
    partial?: boolean;       // during modification
    selected?: boolean;
    ascii?: boolean;         // ascii cells

    onClick?: (ev: MouseCellEvent) => any;
    onMouseOver?: (ev: MouseCellEvent) => any;
    onMouseOut?: (ev: MouseCellEvent) => any;
}

function byteToString(b: FileByte): string {
    if (b == FileByteSpecial.PENDING)
        return "??";
    else if (b == FileByteSpecial.EOF)
        return "&nbsp;&nbsp;";
    else
        return Converters.hexWithPad(b, 2);
}

export default class EditorCell extends React.Component<EditorCellProps, {}> {

    private onMouseEvent(cb: (ev: MouseCellEvent) => any, ev: MouseEvent) {
        var cellEvent: MouseCellEvent = ev as MouseCellEvent;
        cellEvent.cell = {
            row: this.props.row,
            column: this.props.column,
            ascii: this.props.ascii
        };
        cb(cellEvent);
    }

    render() {
        var val: string;

        if (this.props.value == null)
            val = "&nbsp;" + (this.props.ascii ? "" : "&nbsp;");
        else
            val = this.props.ascii ? Converters.byteToAscii(this.props.value) : byteToString(this.props.value);

        return (
            <div
                className={"editor-cell " +
                    (this.props.ascii
                        ? "editor-ascii-cell"
                        : "editor-byte-cell") }
                onClick={this.onMouseEvent.bind(this, this.props.onClick) }
                onMouseOver = { this.onMouseEvent.bind(this, this.props.onMouseOver) }
                onMouseOut = { this.onMouseEvent.bind(this, this.props.onMouseOut) }
                style = {{
                    color: this.props.color,
                    backgroundColor: this.props.selected ? "lightskyblue" : null
                }}>
                {val}
            </div>);
    }
}