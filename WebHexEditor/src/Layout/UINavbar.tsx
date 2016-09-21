import * as React from "react";
import { Navbar, Nav, NavItem, NavDropdown, MenuItem, Glyphicon } from "react-bootstrap";

interface UINavbarProps {
    onSelect: (selectedItem: UINavbarItem, event?: React.SyntheticEvent) => any;
}

export enum UINavbarItem {
    Submenu,
    NewFile,
    OpenFile,
    SaveFile,
    SelectAll,
    Undo,
    Redo,
    InsertionMode,
    Cut,
    Copy,
    Paste,
    FillWith
}

export class UINavbar extends React.Component<UINavbarProps, {}> {
    render() {
        return (
            <Navbar inverse>
                <Navbar.Header>
                  <Navbar.Brand>
                    <a href="#">WebHexEditor</a>
                  </Navbar.Brand>
                  <Navbar.Toggle />
                </Navbar.Header>
                <Navbar.Collapse>
                    <Nav onSelect={this.props.onSelect}>
                        <NavDropdown eventKey={UINavbarItem.Submenu} title="File" id="basic-nav-dropdown">
                            <MenuItem eventKey={UINavbarItem.NewFile}>
                                <Glyphicon glyph="file" />
                                New
                            </MenuItem>
                            <MenuItem eventKey={UINavbarItem.OpenFile}>
                                <Glyphicon glyph="open" />
                                Open
                            </MenuItem>
                            <MenuItem eventKey={UINavbarItem.SaveFile}>
                                <Glyphicon glyph="save" />
                                Save
                            </MenuItem>
                        </NavDropdown>
                        <NavDropdown eventKey={UINavbarItem.Submenu} title="Edit" id="basic-nav-dropdown">
                            <MenuItem eventKey={UINavbarItem.SelectAll}>
                                <Glyphicon glyph="align-justify" />
                                Select all
                            </MenuItem>
                            <MenuItem divider />
                            <MenuItem eventKey={UINavbarItem.Undo}>
                                <Glyphicon glyph="erase" />
                                Undo
                            </MenuItem>
                            <MenuItem eventKey={UINavbarItem.Redo}>
                                <Glyphicon glyph="repeat" />
                                Redo
                            </MenuItem>
                            <MenuItem divider />
                            <MenuItem eventKey={UINavbarItem.Cut}>
                                <Glyphicon glyph="scissors" />
                                Cut
                            </MenuItem>
                            <MenuItem eventKey={UINavbarItem.Copy}>
                                <Glyphicon glyph="copy" />
                                Copy
                            </MenuItem>
                            <MenuItem eventKey={UINavbarItem.Paste}>
                                <Glyphicon glyph="paste" />
                                Paste
                            </MenuItem>
                            <MenuItem divider />
                            <MenuItem eventKey={UINavbarItem.FillWith}>
                                <Glyphicon glyph="pencil" />
                                Fill with...
                            </MenuItem>
                        </NavDropdown>
                    </Nav>
                    <Nav pullRight>
                        <NavItem eventKey={1} href="#">Link Right</NavItem>
                        <NavItem eventKey={2} href="#">Link Right</NavItem>
                    </Nav>
                </Navbar.Collapse>
              </Navbar>
            )    
    }
}