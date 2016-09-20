import Editor from "./Layout/Editor/Editor"

// @todo
// I think it should be renamed to GlobalFocus

export namespace Events {
    var focusedEditor: Editor = null;

    export function stealFocus(object: Editor) {
        if (object !== focusedEditor) {
            var event = new CustomEvent("focusStolen", { 'detail': object });
            focusedEditor = object;
            window.dispatchEvent(event);
        }
    }

    export function forgetFocus() {
        stealFocus(null);
    }

    export function getFocusedEditor(): Editor {
        return focusedEditor;
    }
}