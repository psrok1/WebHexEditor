import * as React from "react";
import { FileRow, FileByte, FileByteSpecial } from "../../Datastore/FileContext";
import { Converters } from "../../Converters.ts"

export interface EditorRowProps {
    row: FileRow;
}

function formatSectionLabel(label: string) {
    const SECTION_SPACE = 64;

    if (label.length + 2 > SECTION_SPACE)
        label = label.substr(0, SECTION_SPACE - 5) + "...";

    var dashes = Math.floor((SECTION_SPACE - (label.length + 2)) / 2);
    var ret = " ";

    for (var i = 0; i < dashes; i++)
        ret += "-"

    ret += " " + label + " ";

    for (var i = 0; i < dashes; i++)
        ret += "-"

    return ret;
}

export default class EditorRow extends React.Component<EditorRowProps, {}>
{
    render() {
        if (this.props.row.sectionLabel)
            return (
                <div className="editor-row">
                    <div className="editor-cell editor-sec-offs">
                        { Converters.hexWithPad(this.props.row.sectionOffset & 0xFFFFFFFF, 8) }
                    </div>
                    <div className="editor-cell editor-sec-name">
                        { formatSectionLabel(this.props.row.sectionLabel) }
                    </div>
                </div>)

        var offsetCell = (<div className="editor-cell editor-offs-cell">{
            Converters.hexWithPad(this.props.row.fileData.offset & 0xFFFFFFFF, 8)
        }</div>);

        var byteCells: JSX.Element[] = [];
        var asciiCells: JSX.Element[] = [];

        var cellKey = 0;

        /* Left-side padding */
        for (var i = 0; i < this.props.row.padding; i++)
        {
            byteCells.push(<div className="editor-cell editor-byte-cell" key={cellKey++}>&nbsp;&nbsp;</div>);
            asciiCells.push(<div className="editor-cell editor-ascii-cell" key={cellKey++}>&nbsp;</div>);
        }

        /* Cell drawing */
        for (var idx in this.props.row.fileData.data)
        {
            var byte = this.props.row.fileData.data[idx];
            byteCells.push(
                <div className="editor-cell editor-byte-cell" key={cellKey++}>
                    { byteToString(byte) }
                </div>);
            asciiCells.push(
                <div className="editor-cell editor-ascii-cell" key={cellKey++}>
                    { Converters.byteToAscii(byte) }
                </div>);
        }

        /* Right-side padding */
        for (var i = byteCells.length; i < 16 /* WIDTH */; i++) {
            byteCells.push(<div className="editor-cell editor-byte-cell" key={cellKey++}>&nbsp;&nbsp;</div>);
            asciiCells.push(<div className="editor-cell editor-ascii-cell" key={cellKey++}>&nbsp;</div>);
        }

        return (
            <div className="editor-row">
                { offsetCell }
                <div className="editor-bytes">
                    { byteCells }
                </div>
                <div className="editor-ascii">
                    { asciiCells }
                </div>
            </div>);
    }
}
