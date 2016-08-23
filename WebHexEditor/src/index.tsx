import * as React from "react";
import * as ReactDOM from "react-dom";
import { Jumbotron } from "react-bootstrap";

import { initLayout } from "./Layout/Base.tsx";
import MainMenu from "./Layout/MainMenu";

window.onload = () => {
    ReactDOM.render((
        <section>
            <MainMenu />
            <div id="layout" />
        </section>
        ), document.body);

    initLayout(document.getElementById("layout"));
}