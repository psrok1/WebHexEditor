import * as React from "react";
import { Modal, Button } from "react-bootstrap";

interface LoadModalState {
    showModal?: boolean,
    selectedFile?: File
}

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

export default class LoadModal extends React.Component<{}, LoadModalState>
{
    constructor() {
        super();
        this.state = { showModal: true, selectedFile: null }
    }

    confirm() {

    }

    cancel() {
        this.setState({ showModal: false });
    }

    open() {
        this.setState({ showModal: true });
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

    componentDidMount() {
        let dropZone = document.getElementById("drop-zone");
        dropZone.addEventListener('dragover', (evt: DragEvent) => this.handleDragOver(evt), false);
        dropZone.addEventListener('drop', (evt: DragEvent) => this.handleFileSelect(evt), false);

        let fileSelector = document.getElementById('file-selector');
        fileSelector.addEventListener('change', (evt: DragEvent) => this.handleFileSelect(evt), false);
    }

    render() {
        return (
            <Modal id="loadModal" show={this.state.showModal} onHide={() => this.confirm()}>
                <Modal.Header closeButton>
                    <Modal.Title>Open new file</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <input type="file" id="file-selector" />
                    <div id="drop-zone">or drop files here...</div>
                    <FileInformation file={this.state.selectedFile} />
                </Modal.Body>
                <Modal.Footer>
                    <Button disabled={!this.state.selectedFile} onClick={() => this.confirm()}>Load</Button>
                    <Button onClick={() => this.cancel()}>Cancel</Button>
                </Modal.Footer>
            </Modal>
            )
    }
}