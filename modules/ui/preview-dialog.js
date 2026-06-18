import { extensionName, fieldPreviewTitleByKey, fieldEditorSelectorByKey } from "../constants.js";
import { escapeHtml } from "../utils.js";
import { Popup, POPUP_TYPE, POPUP_RESULT } from "../../../../../popup.js";
import { popupState } from "./state.js";
import { resetRewriteUIState } from "./status.js";

function buildPreviewSections(rewrittenData, fieldKey, greetingIndexes) {
    const value = rewrittenData[fieldKey];
    if (value === undefined) {
        return "";
    }

    if (fieldKey === "alternate_greetings") {
        if (!Array.isArray(value) || value.length === 0) {
            return "";
        }
        const indexes = Array.isArray(greetingIndexes) ? greetingIndexes : [];
        return `
            <div class="pov-rewrite-preview-section">
                <h4>${fieldPreviewTitleByKey[fieldKey]} (${value.length})</h4>
                ${value.map((greeting, i) => `
                    <div class="info-block pov-rewrite-preview-greeting">
                        <strong>Greeting ${indexes[i] !== undefined ? indexes[i] + 1 : i + 1}:</strong>
                        <p>${escapeHtml(greeting)}</p>
                    </div>
                `).join("")}
            </div>
        `;
    }

    return `
        <div class="pov-rewrite-preview-section">
            <h4>${fieldPreviewTitleByKey[fieldKey]}</h4>
            <p>${escapeHtml(value || "(empty)")}</p>
        </div>
    `;
}

function updateCharacterFromAIResponse(rewrittenData, character, fieldKey, greetingIndexes) {
    const data = character.data || {};
    const value = rewrittenData[fieldKey];
    if (value === undefined) return;

    if (fieldKey === "alternate_greetings") {
        const existing = Array.isArray(data.alternate_greetings) ? [...data.alternate_greetings] : [];
        const newGreetings = Array.isArray(value) ? value : [];
        greetingIndexes.forEach((idx, i) => {
            if (idx >= 0 && idx < existing.length && i < newGreetings.length) {
                existing[idx] = newGreetings[i];
            }
        });
        data.alternate_greetings = existing;
        $(fieldEditorSelectorByKey.alternate_greetings).val(JSON.stringify(existing, null, 2));
    } else {
        data[fieldKey] = value;
        $(fieldEditorSelectorByKey[fieldKey]).val(value);

        if (fieldKey === "first_mes" || fieldKey === "mes_example") {
            character[fieldKey] = value;
        }
        $(fieldEditorSelectorByKey[fieldKey]).trigger("change");
    }
}

export async function showPreviewDialog(rewrittenData, character, fieldKey, greetingIndexes = null) {
    console.log(`[${extensionName}] Showing preview dialog for field: ${fieldKey}`);
    const previewSections = buildPreviewSections(rewrittenData, fieldKey, greetingIndexes);
    const previewHtml = `
        <div class="pov-rewrite-preview">
            <h3>Preview Changes</h3>
            <p>Review the rewritten field before applying changes. The following field will be updated: <strong>${fieldPreviewTitleByKey[fieldKey] || fieldKey}</strong></p>

            ${previewSections}

            <div class="info-block info pov-rewrite-preview-apply">
                <strong>Apply these changes?</strong><br>
                <small>Only the selected field will be updated with the first-person perspective version above.</small>
            </div>
        </div>
    `;

    const popup = new Popup(previewHtml, POPUP_TYPE.CONFIRM, "", {
        okButton: "Apply Changes",
        cancelButton: "Cancel",
        wide: true,
        large: true,
        allowVerticalScrolling: true,
    });

    const result = await popup.show();
    console.log(`[${extensionName}] Preview dialog result:`, result);

    if (result === POPUP_RESULT.AFFIRMATIVE) {
        updateCharacterFromAIResponse(rewrittenData, character, fieldKey, greetingIndexes);
        $("#create_button").trigger("click");
        toastr.success("Character field rewritten to first-person perspective!");

        if (popupState.rewritePopup && popupState.rewritePopup.dlg && popupState.rewritePopup.dlg.hasAttribute("open")) {
            await popupState.rewritePopup.completeAffirmative();
        }
    } else {
        resetRewriteUIState();
    }

    return result === POPUP_RESULT.AFFIRMATIVE;
}
