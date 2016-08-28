import * as React from "react";
import * as ReactDOM from "react-dom";
import { Jumbotron } from "react-bootstrap";

import UIView from "./Layout/UIView.tsx";
import { initLayout } from "./Layout/Base.tsx";

window.onload = () => {
    ReactDOM.render((
        <UIView />
        ), document.body);

    initLayout(document.getElementById("layout"));
}