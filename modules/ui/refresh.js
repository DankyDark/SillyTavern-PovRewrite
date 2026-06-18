import { fieldPreviewTitleByKey } from "../constants.js";
import { escapeHtml } from "../utils.js";
import { buildRewritePrompt } from "../character-data.js";
import { popupState } from "./state.js";
import { getPopupScope, getRewritePopupElements, setControlDisabledState } from "./elements.js";
import { getMissingPlaceholders } from "./template.js";
import { getSelectedFieldText, canStartRewrite } from "./loading.js";
import { updateRewriteStatus, rewriteStatusMarkup } from "./status.js";
import { buildGreetingsSelectorHtml } from "./markup.js";

let greetingsRenderedFor = null;

export function updatePopupSelectionFromDom() {
    const scope = getPopupScope();
    const fieldSelect = scope.querySelector("#pov-rewrite-field-select");
    popupState.selectedFieldKey = fieldSelect ? String(fieldSelect.value) : "";

    if (popupState.selectedFieldKey === "alternate_greetings" && popupState.characterData) {
        const select = scope.querySelector("#pov-rewrite-greeting-select");
        if (select) {
            const idx = Number(select.value);
            if (Number.isInteger(idx) && idx >= 0 && idx < popupState.characterData.alternate_greetings.length) {
                popupState.selectedGreetingIndexes = [idx];
            } else {
                popupState.selectedGreetingIndexes = [];
            }
        } else {
            popupState.selectedGreetingIndexes = [];
        }
    } else {
        popupState.selectedGreetingIndexes = [];
    }
}

export function renderGreetingsSection() {
    const { greetingsContainer } = getRewritePopupElements();
    if (!greetingsContainer) return false;

    const scope = getPopupScope();
    const fieldSelect = scope.querySelector("#pov-rewrite-field-select");
    const currentFieldKey = fieldSelect ? String(fieldSelect.value) : "";
    const isGreetings = currentFieldKey === "alternate_greetings";
    greetingsContainer.classList.toggle("hidden", !isGreetings);

    if (!isGreetings || !popupState.characterData) {
        greetingsContainer.innerHTML = "";
        greetingsRenderedFor = null;
        return false;
    }

    if (greetingsRenderedFor === popupState.characterData) {
        return false;
    }

    greetingsContainer.innerHTML = buildGreetingsSelectorHtml(popupState.characterData);
    wireGreetingsSelect();
    greetingsRenderedFor = popupState.characterData;
    return true;
}

function wireGreetingsSelect() {
    const scope = getPopupScope();
    const select = scope.querySelector("#pov-rewrite-greeting-select");
    if (!select) return;

    select.addEventListener("change", () => {
        syncGreetingPreview();
        refreshPopupPromptPreview();
    });
}

function syncGreetingPreview() {
    const scope = getPopupScope();
    const select = scope.querySelector("#pov-rewrite-greeting-select");
    const preview = scope.querySelector("#pov-rewrite-greeting-preview");
    if (!select || !preview || !popupState.characterData) return;
    const greetings = popupState.characterData.alternate_greetings || [];
    const idx = Number(select.value);
    if (Number.isInteger(idx) && idx >= 0 && idx < greetings.length) {
        preview.textContent = String(greetings[idx] ?? "");
    }
}

export function refreshPopupPromptPreview() {
    if (!popupState.characterData) return;
    updatePopupSelectionFromDom();
    const justRendered = renderGreetingsSection();
    if (justRendered) {
        updatePopupSelectionFromDom();
    }
    syncGreetingPreview();

    const prompt = buildRewritePrompt(popupState.characterData, popupState.selectedFieldKey, popupState.selectedGreetingIndexes);
    const scope = getPopupScope();
    const enabledFieldEl = scope.querySelector("#pov-rewrite-enabled-field");
    const tokenEstimateEl = scope.querySelector("#pov-rewrite-estimate");
    const payloadEl = scope.querySelector("#pov-rewrite-payload");
    const { startBtn } = getRewritePopupElements();

    if (enabledFieldEl) {
        let label = fieldPreviewTitleByKey[popupState.selectedFieldKey] || "(none)";
        if (popupState.selectedFieldKey === "alternate_greetings" && popupState.selectedGreetingIndexes.length) {
            const idx = popupState.selectedGreetingIndexes[0];
            label += ` (Greeting #${idx + 1})`;
        }
        enabledFieldEl.textContent = label;
    }

    if (tokenEstimateEl) {
        tokenEstimateEl.textContent = `~${Math.ceil(prompt.length / 4).toLocaleString()}`;
    }

    if (payloadEl) {
        payloadEl.innerHTML = escapeHtml(prompt);
    }

    const missing = getMissingPlaceholders();
    const { templateWarningEl, emptyWarningEl } = getRewritePopupElements();
    if (templateWarningEl) {
        if (missing.length > 0) {
            templateWarningEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i><span>Prompt template is missing required placeholder(s): ${missing.map(escapeHtml).join(", ")}. Fix it in the extension settings.</span>`;
            templateWarningEl.classList.remove("hidden");
        } else {
            templateWarningEl.classList.add("hidden");
            templateWarningEl.innerHTML = "";
        }
    }
    if (emptyWarningEl) {
        if (!getSelectedFieldText()) {
            const reason = popupState.selectedFieldKey === "alternate_greetings"
                ? "No greeting is selected to rewrite."
                : `Selected field "${fieldPreviewTitleByKey[popupState.selectedFieldKey] || popupState.selectedFieldKey || ""}" is empty.`;
            emptyWarningEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i><span>${escapeHtml(reason)}</span>`;
            emptyWarningEl.classList.remove("hidden");
        } else {
            emptyWarningEl.classList.add("hidden");
            emptyWarningEl.innerHTML = "";
        }
    }

    updateRewriteStatus(rewriteStatusMarkup.ready);

    const canStart = canStartRewrite();
    setControlDisabledState(startBtn, !canStart);
}

export function resetGreetingsRenderState() {
    greetingsRenderedFor = null;
}
