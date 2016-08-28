import * as React from "react";
import { Navbar, Nav, NavItem, NavDropdown, MenuItem } from "react-bootstrap";

interface UINavbarProps {
    onSelect: (selectedItem: UINavbarItem, event?: React.SyntheticEvent) => any;
}

export enum UINavbarItem {
    OpenFile,
    Something
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
                        <NavItem eventKey={UINavbarItem.OpenFile} href="#">Open file</NavItem>
                        <NavItem eventKey={UINavbarItem.Something} href="#">Link</NavItem>
                        <NavDropdown eventKey={UINavbarItem.Something} title="Dropdown" id="basic-nav-dropdown">
                            <MenuItem eventKey={UINavbarItem.Something}>Action</MenuItem>
                            <MenuItem eventKey={UINavbarItem.Something}>Another action</MenuItem>
                            <MenuItem eventKey={UINavbarItem.Something}>Something else here</MenuItem>
                            <MenuItem divider />
                            <MenuItem eventKey={UINavbarItem.Something}>Separated link</MenuItem>
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