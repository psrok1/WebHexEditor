import * as React from "react";
import { ProgressBar } from "react-bootstrap";

interface EditorOverlayProps {
    visible: boolean;
    width: number;
    height: number;
    label: string;
    progress: number;
}

export default class EditorOverlay extends React.Component<EditorOverlayProps, {}>
{
    render() {
        return (
            <div className="editor-overlay" style={{
                position: "absolute",
                width: this.props.width,
                height: this.props.height,
                top: "0px",
                display: this.props.visible ? null : "none"
            }}>
                <div className="editor-overlay-wrapper">
                    <div className="editor-overlay-message">
                        <div>{this.props.label}</div>
                        <div className="editor-overlay-progress">
                            <ProgressBar active={!this.props.progress} now={this.props.progress || 100} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}