import * as React from "react";

interface EditorScrollbarProps {
    scrollArea: number;
    scrollMax: number;
    scrollTo: number;
    doScroll: (index: number) => any;
}

class EditorScrollbar extends React.Component<EditorScrollbarProps, {}> {
    constructor() {
        super();
    }

    private evaluatePos() {
        var step = Math.max(1.0, this.props.scrollMax / this.props.scrollArea);
        return Math.floor(this.props.scrollTo / step) + "px";
    }

    private startDrag(ev: MouseEvent) {
        var that = this;
        var mouseY = ev.screenY;
        var initialPos = this.props.scrollTo;

        var keepInRange = (val: number, min: number, max: number) =>
            Math.max(min, Math.min(max, val));

        function onMoveDrag(ev: MouseEvent) {
            var dy = ev.screenY - mouseY;
            var step = Math.max(1.0, that.props.scrollMax / that.props.scrollArea);
            var pos = Math.floor(keepInRange(initialPos + (dy * step), 0, that.props.scrollMax - 1));
            that.props.doScroll(pos);
        }

        function onStopDrag(ev: MouseEvent) {
            window.removeEventListener("mousemove", onMoveDrag);
            window.removeEventListener("mouseup", onStopDrag);
        }

        window.addEventListener("mousemove", onMoveDrag);
        window.addEventListener("mouseup", onStopDrag);

        ev.stopPropagation();
        ev.preventDefault();
    }

    private clickScrollbar(ev: MouseEvent) {
        // @todo: next, previous page
        ev.stopPropagation();
        ev.preventDefault();
    }

    render() {
        return (
            <div className="editor-scrollbar"
                onMouseDown={ this.clickScrollbar.bind(this) }
                style={{ height: this.props.scrollArea }}>
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
    scrollTo: number;
    doScroll: (index: number) => any;
}

export default class EditorScrollbox extends React.Component<EditorScrollboxProps, {}> {
    private onWheel(ev: WheelEvent) {
        this.props.doScroll(Math.floor(this.props.scrollTo + ev.deltaY));
        ev.stopPropagation();
    }

    render() {
        var rowsPerView = Math.ceil(this.props.height / this.props.rowHeight);
        var rows: Array<JSX.Element> = []
        for (var i = 0; i < rowsPerView; i++) {
            if ((this.props.scrollTo + i) >= this.props.rowCount)
                break;
            rows.push(this.props.rowRenderer(this.props.scrollTo + i));
        }

        return (
            <div className="editor-scrollbox"
                onWheel={this.onWheel.bind(this)}

                style={{
                    width: this.props.width,
                    height: this.props.height
                }}>
                {rows}
                <EditorScrollbar
                    scrollArea={ this.props.height }
                    scrollMax={ this.props.rowCount }
                    scrollTo={ this.props.scrollTo }
                    doScroll={ this.props.doScroll }/>
            </div>);
    }
}
