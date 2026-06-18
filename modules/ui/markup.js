import { rewriteFieldKeys, fieldPreviewTitleByKey } from "../constants.js";
import { escapeHtml } from "../utils.js";
import { truncate } from "./template.js";
import { popupState, GREETING_PREVIEW_LENGTH } from "./state.js";
import { getAvailableFields } from "../character-data.js";

export function buildFieldSelectorHtml(availableFields = rewriteFieldKeys) {
    const fields = Array.isArray(availableFields) && availableFields.length
        ? availableFields
        : rewriteFieldKeys;

    if (fields.length === 0) {
        return `<p class="extensions_warning"><small>This character has no fields available to rewrite.</small></p>`;
    }

    const validSelected = fields.includes(popupState.selectedFieldKey) ? popupState.selectedFieldKey : fields[0];

    const options = fields.map((fieldKey) => `
        <option value="${fieldKey}" ${fieldKey === validSelected ? "selected" : ""}>
            ${fieldPreviewTitleByKey[fieldKey] || fieldKey}
        </option>
    `).join("");

    return `
        <select id="pov-rewrite-field-select" class="text_pole pov-rewrite-field-select">
            ${options}
        </select>
    `;
}

export function buildGreetingsSelectorHtml(characterData) {
    const greetings = Array.isArray(characterData.alternate_greetings)
        ? characterData.alternate_greetings
        : [];

    const nonEmptyIndexes = greetings
        .map((g, i) => (typeof g === "string" && g.trim() !== "" ? i : -1))
        .filter((i) => i >= 0);

    if (nonEmptyIndexes.length === 0) {
        return `<p class="extensions_warning"><small>This character has no alternate greetings.</small></p>`;
    }

    const validSelected = popupState.selectedGreetingIndexes.find((i) => nonEmptyIndexes.includes(i));
    const selectedIndex = validSelected !== undefined ? validSelected : nonEmptyIndexes[0];

    const options = nonEmptyIndexes.map((index) => {
        const preview = escapeHtml(truncate(greetings[index], GREETING_PREVIEW_LENGTH));
        return { index, preview, selected: index === selectedIndex };
    });

    return `
        <div class="pov-rewrite-greeting-toolbar">
            <label class="pov-rewrite-greeting-dropdown-label" for="pov-rewrite-greeting-select">
                <i class="fa-solid fa-comment-dots"></i>
                <span>Greeting to rewrite</span>
            </label>
            <select id="pov-rewrite-greeting-select" class="text_pole pov-rewrite-greeting-select">
                ${options.map((opt) => `
                    <option value="${opt.index}" ${opt.selected ? "selected" : ""}>
                        #${opt.index + 1} — ${opt.preview}
                    </option>
                `).join("")}
            </select>
            <div id="pov-rewrite-greeting-preview" class="pov-rewrite-greeting-preview">
                ${escapeHtml(greetings[selectedIndex] ?? "")}
            </div>
        </div>
    `;
}

export function buildRewritePopupHtml(characterName, prompt, tokenCount) {
    const availableFields = getAvailableFields(popupState.characterData);
    const fieldSelectorHtml = buildFieldSelectorHtml(availableFields);

    return `
        <div class="pov-rewrite-popup">
            <div class="pov-rewrite-header">
                <h3>Perspective Rewrite</h3>
                <p class="pov-rewrite-subtitle">Choose a single field to rewrite to first-person perspective.</p>
                <div class="pov-rewrite-info">
                    <div class="pov-rewrite-info-item">
                        <strong>Character</strong> ${escapeHtml(characterName)}
                    </div>
                    <div class="pov-rewrite-info-item">
                        <strong>Selected</strong> <span id="pov-rewrite-enabled-field">${fieldPreviewTitleByKey[popupState.selectedFieldKey] || "(none)"}</span>
                    </div>
                    <div class="pov-rewrite-info-item">
                        <strong>Tokens</strong> <span id="pov-rewrite-estimate">~${tokenCount.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div id="pov-rewrite-template-warning" class="pov-rewrite-template-warning hidden"></div>
            <div id="pov-rewrite-empty-warning" class="pov-rewrite-template-warning hidden"></div>

            <div class="pov-rewrite-layout">
                <div class="pov-rewrite-layout-left">
                    <div class="pov-rewrite-payload-section">
                        <h4>Field To Rewrite</h4>
                        ${fieldSelectorHtml}
                        <div id="pov-rewrite-greetings" class="pov-rewrite-popup-greetings-wrapper hidden"></div>
                    </div>
                </div>

                <div class="pov-rewrite-layout-right">
                    <div class="pov-rewrite-payload-section pov-rewrite-payload-section--preview">
                        <h4>Prompt Preview</h4>
                        <div id="pov-payload-container" class="pov-rewrite-payload-container">
                            <pre id="pov-rewrite-payload" class="pov-rewrite-payload">${escapeHtml(prompt)}</pre>
                        </div>
                    </div>
                </div>
            </div>

            <div class="pov-rewrite-controls">
                <div id="pov-rewrite-status" class="pov-rewrite-status hidden"></div>

                <div id="pov-rewrite-loading" class="pov-rewrite-loading hidden">
                    <div class="spinner-container">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                    </div>
                    <span>Rewriting character card...</span>
                </div>
            </div>
        </div>
    `;
}
