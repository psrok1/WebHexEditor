export namespace Events {
    var focusedObject: any = null;

    export function stealFocus(object: any) {
        if (object !== focusedObject) {
            var event = new CustomEvent("focusStolen", { 'detail': object });
            focusedObject = object;
            window.dispatchEvent(event);
        }
    }

    export function forgetFocus() {
        stealFocus(null);
    }
}