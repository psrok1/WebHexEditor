import * as React from "react";

interface EditorScrollbarProps {
    scrollArea: number;
    scrollMax: number;
    onScroll?: (index: number) => any;
}

interface EditorScrollbarState {
    scrollPos?: number;
}

class EditorScrollbar extends React.Component<EditorScrollbarProps, EditorScrollbarState> {
    constructor() {
        super();
        this.state = { scrollPos: 0 };
    }

    private evaluatePos() {
        var step = Math.max(1.0, this.props.scrollMax / this.props.scrollArea);
        return Math.floor(this.state.scrollPos / step) + "px";
    }

    private startDrag(ev: MouseEvent) {
        var that = this;
        var mouseY = ev.screenY;
        var initialPos = this.state.scrollPos;

        var keepInRange = (val: number, min: number, max: number) =>
            Math.max(min, Math.min(max, val));

        function onMoveDrag(ev: MouseEvent) {
            var dy = ev.screenY - mouseY;
            var step = Math.max(1.0, that.props.scrollMax / that.props.scrollArea);
            var pos = Math.floor(keepInRange(initialPos + (dy * step), 0, that.props.scrollMax - 1));

            that.setState({ scrollPos: pos });
            that.props.onScroll(pos);
        }

        function onStopDrag(ev: MouseEvent) {
            window.removeEventListener("mousemove", onMoveDrag);
            window.removeEventListener("mouseup", onStopDrag);
        }

        window.addEventListener("mousemove", onMoveDrag);
        window.addEventListener("mouseup", onStopDrag);

        ev.preventDefault();
    }

    render() {
        return (
            <div className="editor-scrollbar" style={{ height: this.props.scrollArea }}>
            <div className="editor-scroll"
                style={{
                    top: this.evaluatePos(),
                    height: Math.max(16, this.props.scrollArea - this.props.scrollMax)+"px"
                    }}
                onMouseDown={this.startDrag.bind(this)}>&nbsp;</div>
        </div>)
    }
}

interface EditorScrollboxProps {
    width: number;
    height: number;
    rowRenderer: (index: number) => JSX.Element;
    rowCount: number;
    rowHeight: number;
}

interface EditorScrollboxState {
    currentRow?: number;
}

export default class EditorScrollbox extends React.Component<EditorScrollboxProps, EditorScrollboxState> {
    constructor() {
        super();
        this.state = { currentRow: 0 };
    }

    private setCurrentRow(index: number) {
        if (this.state.currentRow != index)
            this.setState({ currentRow: index });
    }

    render() {
        var rowsPerView = Math.ceil(this.props.height / this.props.rowHeight);
        var rows: Array<JSX.Element> = []
        for (var i = 0; i < rowsPerView; i++) {
            if ((this.state.currentRow + i) >= this.props.rowCount)
                break;
            rows.push(this.props.rowRenderer(this.state.currentRow + i));
        }

        return (
            <div className="editor-scrollbox"
                style={{
                    width: this.props.width,
                    height: this.props.height
                }}>
                {rows}
                <EditorScrollbar
                    scrollArea={this.props.height}
                    scrollMax={this.props.rowCount}
                    onScroll={ this.setCurrentRow.bind(this) }/>
            </div>);
    }
}
