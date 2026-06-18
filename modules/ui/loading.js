import { popupState } from "./state.js";
import { getPopupScope, getRewritePopupElements, setControlDisabledState } from "./elements.js";
import { getMissingPlaceholders } from "./template.js";

export function getSelectedFieldText() {
    if (!popupState.characterData || !popupState.selectedFieldKey) return "";
    if (popupState.selectedFieldKey === "alternate_greetings") {
        const greetings = Array.isArray(popupState.characterData.alternate_greetings)
            ? popupState.characterData.alternate_greetings
            : [];
        return popupState.selectedGreetingIndexes
            .filter((i) => i >= 0 && i < greetings.length)
            .map((i) => String(greetings[i] ?? ""))
            .join("\n");
    }
    const value = popupState.characterData[popupState.selectedFieldKey];
    return typeof value === "string" ? value.trim() : "";
}

export function canStartRewrite() {
    if (getMissingPlaceholders().length > 0) return false;
    if (!popupState.selectedFieldKey) return false;
    if (!getSelectedFieldText()) return false;
    return true;
}

export function setRewriteLoadingState(isLoading) {
    const scope = getPopupScope();
    const { startBtn, abortBtn, statusEl, loadingEl, payloadContainer, greetingsContainer } = getRewritePopupElements();
    setControlDisabledState(startBtn, isLoading ? true : !canStartRewrite());
    setControlDisabledState(abortBtn, !isLoading);
    if (statusEl) statusEl.classList.toggle("hidden", isLoading);
    if (loadingEl) loadingEl.classList.toggle("hidden", !isLoading);
    if (payloadContainer) payloadContainer.classList.toggle("disabled", isLoading);

    if (greetingsContainer) {
        greetingsContainer.classList.toggle("pov-rewrite-locked", isLoading);
        greetingsContainer.setAttribute("aria-busy", String(isLoading));
    }

    $(scope).find("#pov-rewrite-field-select, #pov-rewrite-greeting-select")
        .prop("disabled", isLoading);
}
