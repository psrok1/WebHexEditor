﻿import * as React from "react";

import { UINavbar, UINavbarItem } from "./UINavbar";
import LoadModal from "./LoadModal";
import { layout } from "./Base";

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
            default:
                throw new Error("Selected unexpected UINavbarItem");
        }
    }

    loadModalClose() {
        this.setState({ loadModalOpened: false });
    }

    loadFile(file: File) {
        this.loadModalClose();
        layout.root.contentItems[0].addChild({
            type: 'react-component',
            component: 'Editor',
            props: { file: file }
        });
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