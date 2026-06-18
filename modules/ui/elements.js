import { popupState } from "./state.js";

export function getPopupScope() {
    return popupState.rewritePopup?.dlg || document;
}

export function getRewritePopupElements() {
    const scope = getPopupScope();
    return {
        startBtn: scope.querySelector(".pov-rewrite-start-popup-btn"),
        abortBtn: scope.querySelector(".pov-rewrite-abort-popup-btn"),
        statusEl: scope.querySelector("#pov-rewrite-status"),
        loadingEl: scope.querySelector("#pov-rewrite-loading"),
        payloadContainer: scope.querySelector("#pov-payload-container"),
        greetingsContainer: scope.querySelector("#pov-rewrite-greetings"),
        templateWarningEl: scope.querySelector("#pov-rewrite-template-warning"),
        emptyWarningEl: scope.querySelector("#pov-rewrite-empty-warning"),
    };
}

export function setControlDisabledState(control, isDisabled) {
    if (!control) return;

    if (control instanceof HTMLButtonElement) {
        control.disabled = isDisabled;
        return;
    }

    control.classList.toggle("disabled", isDisabled);
    control.setAttribute("aria-disabled", String(isDisabled));
}
