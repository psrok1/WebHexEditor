import * as React from "react";
import LoadModal from "./LoadModal";

export interface HelloProps { compiler: string; framework: string; }

export class Hello extends React.Component<HelloProps, {}> {
    render() {
        if(this.props.compiler == "A")
            return <LoadModal/>
        else
            return <h1>Hello from {this.props.compiler} and {this.props.framework}!</h1>;
    }
}