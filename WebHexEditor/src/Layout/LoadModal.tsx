﻿import * as React from "react";
import { Modal, Button } from "react-bootstrap";

class FileInformation extends React.Component<{ file: File }, {}>
{
    render() {
        let f = this.props.file;
        
        if(f)
            return (
                <div>
                    <strong>{ encodeURIComponent(f.name) }</strong>
                    ( {f.type || 'n/a'} ) - {f.size} bytes, last modified: 
                    { f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a' }
                </div>
            );
        else
            return <div></div>
    }
}

interface LoadModalProps {
    showModal: boolean;
    onCancel: () => any;
    onConfirm: (file: File) => any;
}

interface LoadModalState {
    selectedFile?: File
}

export default class LoadModal extends React.Component<LoadModalProps, LoadModalState>
{
    constructor() {
        super();
        this.state = { selectedFile: null }
    }

    private handleFileSelect(evt: DragEvent) {
        evt.stopPropagation();
        evt.preventDefault();

        var selectedFile: File;

        if (evt.dataTransfer)
            selectedFile = evt.dataTransfer.files[0];
        else
            selectedFile = (evt.target as HTMLInputElement).files[0];

        this.setState({ selectedFile: selectedFile });
    }

    private handleDragOver(evt: DragEvent) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    }

    componentDidUpdate() {
        if (this.props.showModal) {
            let dropZone = document.getElementById("drop-zone");
            dropZone.addEventListener('dragover', (evt: DragEvent) => this.handleDragOver(evt), false);
            dropZone.addEventListener('drop', (evt: DragEvent) => this.handleFileSelect(evt), false);

            let fileSelector = document.getElementById('file-selector');
            fileSelector.addEventListener('change', (evt: DragEvent) => this.handleFileSelect(evt), false);
        }
    }

    onConfirm() {
        this.props.onConfirm(this.state.selectedFile);
        this.setState({ selectedFile: null });
    }

    onCancel() {
        this.props.onCancel();
        this.setState({ selectedFile: null });
    }

    render() {
        return (
            <Modal id="loadModal" show={this.props.showModal} onHide={() => this.onCancel()}>
                <Modal.Header closeButton>
                    <Modal.Title>Open new file</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <input type="file" id="file-selector" />
                    <div id="drop-zone">or drop files here...</div>
                    <FileInformation file={this.state.selectedFile} />
                </Modal.Body>
                <Modal.Footer>
                    <Button disabled={!this.state.selectedFile} onClick={() => this.onConfirm()}>Load</Button>
                    <Button onClick={() => this.onCancel()}>Cancel</Button>
                </Modal.Footer>
            </Modal>
            )
    }
}