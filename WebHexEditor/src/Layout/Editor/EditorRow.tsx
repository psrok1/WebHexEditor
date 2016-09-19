import * as React from "react";
import { FileRow, FileByte, FileByteSpecial } from "../../Datastore/FileContext";
import { Converters } from "../../Converters.ts"
import EditorCell, { MouseCellEvent } from "./EditorCell"

export interface EditorRowProps {
    row: FileRow;

    selectionColumnStart?: number;
    selectionColumnEnd?: number;

    onCellMouseDown?: (ev: MouseCellEvent) => any;
    onCellMouseUp?: (ev: MouseCellEvent) => any;
    onCellMouseOver?: (ev: MouseCellEvent) => any;
    onCellMouseOut?: (ev: MouseCellEvent) => any;

    onOffsetClick?: any;
    onSectionClick?: any;
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
            byteCells.push(<EditorCell key={i} value={null} />);
            asciiCells.push(<EditorCell key={i} ascii={true} value={null} />);
        }

        /* Cell drawing */
        for (var idx = 0; idx < this.props.row.fileData.data.length; idx++)
        {
            var byte = this.props.row.fileData.data[idx];
            var selected = (this.props.selectionColumnStart !== null &&
                (this.props.row.padding + idx) >= this.props.selectionColumnStart &&
                (this.props.row.padding + idx) <= this.props.selectionColumnEnd);

            var bindIfExist = (cb: Function) => cb && cb.bind(this);

            byteCells.push(
                <EditorCell
                    cellOffset={this.props.row.fileData.offset + idx}
                    key={this.props.row.padding + idx}
                    value={byte}
                    onMouseDown={ bindIfExist(this.props.onCellMouseDown) }
                    onMouseUp={ bindIfExist(this.props.onCellMouseUp) }
                    onMouseOver={ bindIfExist(this.props.onCellMouseOver) }
                    onMouseOut={ bindIfExist(this.props.onCellMouseOut) }
                    selected={ selected }/>
            );
            asciiCells.push(
                <EditorCell
                    cellOffset={this.props.row.fileData.offset + idx}
                    key={this.props.row.padding + idx}
                    value={byte}
                    onMouseDown={ bindIfExist(this.props.onCellMouseDown) }
                    onMouseUp={   bindIfExist(this.props.onCellMouseUp  ) }
                    onMouseOver={ bindIfExist(this.props.onCellMouseOver) }
                    onMouseOut={  bindIfExist(this.props.onCellMouseOut ) }
                    selected={ selected }
                    ascii={ true } />
            );
        }

        /* Right-side padding */
        for (var i = byteCells.length; i < 16 /* WIDTH */; i++) {
            byteCells.push(<EditorCell key={i} value={null} />);
            asciiCells.push(<EditorCell key={i} value={null} ascii={true}/>);
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
