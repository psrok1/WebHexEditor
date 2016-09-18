import * as React from "react";
import { FileRow, FileByte, FileByteSpecial } from "../../Datastore/FileContext";
import { Converters } from "../../Converters.ts"

export interface EditorRowProps {
    row: FileRow;
}

function byteToString(b: FileByte): string {
    if (b == FileByteSpecial.PENDING)
        return "??";
    else if (b == FileByteSpecial.EOF)
        return "  ";
    else
        return Converters.hexWithPad(b, 2);
}

export default class EditorRow extends React.Component<EditorRowProps, {}>
{
    private stringifyRow() {
        var str: string = "";
        if (this.props.row.sectionLabel)
            return "----- " + this.props.row.sectionLabel;
        else {
            str = Converters.hexWithPad(this.props.row.fileData.offset, 8)+"    ";
            for (var byte of this.props.row.fileData.data)
                str += byteToString(byte) + " ";
            return str;
        }
    }

    render() {
        return (
            <div>{ this.stringifyRow() }</div>);
    }
}
