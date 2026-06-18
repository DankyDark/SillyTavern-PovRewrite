export const DEFAULT_FIELD_KEY = "first_mes";
export const GREETING_PREVIEW_LENGTH = 140;
export const REQUIRED_PLACEHOLDERS = ["{{FIELD_TEXT}}"];

/** @type {Window & typeof globalThis & {
 *   povRewritePopupFieldChange?: (event?: Event) => void
 * }}
 */
export const povWindow = window;

export const popupState = {
    rewritePopup: null,
    rewritePopupCloseHandler: null,
    characterData: null,
    selectedFieldKey: DEFAULT_FIELD_KEY,
    selectedGreetingIndexes: [],
};

export function setRewritePopupCloseHandler(handler) {
    popupState.rewritePopupCloseHandler = typeof handler === "function" ? handler : null;
}

export function getPopupSelection() {
    return {
        fieldKey: popupState.selectedFieldKey || null,
        greetingIndexes: [...popupState.selectedGreetingIndexes],
    };
}
