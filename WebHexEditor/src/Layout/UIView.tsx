import * as React from "react";

import { UINavbar, UINavbarItem } from "./UINavbar";
import LoadModal from "./LoadModal";

interface UIViewState {
    loadModalOpened?: boolean;
}

export default class UIView extends React.Component<{}, UIViewState>
{
    constructor() {
        super();
        this.state = { loadModalOpened: false };
    }

    onNavbarSelect(eventKey: UINavbarItem, event?: React.SyntheticEvent) {
        switch (eventKey) {
            case UINavbarItem.OpenFile:
                this.setState({ loadModalOpened: true });
                break;
            case UINavbarItem.Something:
                alert("Something happened");
                break;
            default:
                throw new Error("Selected unexpected UINavbarItem");
        }
    }

    loadModalClose() {
        this.setState({ loadModalOpened: false });
    }

    loadFile(file: File) {
        this.loadModalClose();
        /* ... loading file code */
    }

    render() {
        return (
            <section>
                <UINavbar onSelect={ this.onNavbarSelect.bind(this) }/>
                <div id="layout" />
                <LoadModal
                    showModal={ this.state.loadModalOpened }
                    onCancel={ this.loadModalClose.bind(this) }
                    onConfirm={ this.loadFile.bind(this) }/>
            </section>
        );
    }
}