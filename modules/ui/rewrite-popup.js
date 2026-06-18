import { getContext } from "../../../../../extensions.js";
import { Popup, POPUP_TYPE, POPUP_RESULT } from "../../../../../popup.js";
import { extensionName } from "../constants.js";
import { getCharacterData, buildRewritePrompt, getAvailableFields } from "../character-data.js";
import { popupState, povWindow, DEFAULT_FIELD_KEY } from "./state.js";
import { getRewritePopupElements } from "./elements.js";
import { canStartRewrite } from "./loading.js";
import { buildRewritePopupHtml } from "./markup.js";
import { refreshPopupPromptPreview, renderGreetingsSection, resetGreetingsRenderState } from "./refresh.js";

export async function rewriteCharacterCard() {
    try {
        const context = getContext();
        if (!context.characterId) {
            return toastr.info("No character selected");
        }

        const character = context.characters[context.characterId];
        if (!character) {
            return toastr.error("Character data not found");
        }

        const characterData = getCharacterData(character);
        popupState.characterData = characterData;
        const availableFields = getAvailableFields(characterData);
        if (availableFields.length === 0) {
            return toastr.info("This character has no fields available to rewrite.");
        }
        popupState.selectedFieldKey = availableFields.includes(DEFAULT_FIELD_KEY)
            ? DEFAULT_FIELD_KEY
            : availableFields[0];
        const greetings = Array.isArray(characterData.alternate_greetings) ? characterData.alternate_greetings : [];
        const nonEmptyGreetingIndexes = greetings
            .map((g, i) => (typeof g === "string" && g.trim() !== "" ? i : -1))
            .filter((i) => i >= 0);
        popupState.selectedGreetingIndexes = nonEmptyGreetingIndexes.length > 0 ? [nonEmptyGreetingIndexes[0]] : [];
        resetGreetingsRenderState();

        const prompt = buildRewritePrompt(characterData, popupState.selectedFieldKey, popupState.selectedGreetingIndexes);
        const tokenCount = Math.ceil(prompt.length / 4);
        const popupHtml = buildRewritePopupHtml(character.name || "Unknown", prompt, tokenCount);

        popupState.rewritePopup = new Popup(popupHtml, POPUP_TYPE.TEXT, "", {
            wide: true,
            large: true,
            allowVerticalScrolling: true,
            okButton: "Close",
            cancelButton: null,
            customButtons: [
                {
                    text: "Start Rewrite",
                    classes: [
                        "primary-button",
                        "pov-rewrite-start-popup-btn",
                        ...(canStartRewrite() ? [] : ["disabled"]),
                    ],
                    action: () => {
                        const { startBtn } = getRewritePopupElements();
                        if (startBtn?.classList.contains("disabled")) return;
                        povWindow.povRewriteStartClick?.({
                            preventDefault() { },
                        });
                    },
                },
                {
                    text: "Abort",
                    classes: ["pov-rewrite-abort-popup-btn", "disabled"],
                    action: () => {
                        const { abortBtn } = getRewritePopupElements();
                        if (abortBtn?.classList.contains("disabled")) return;
                        povWindow.povRewriteAbortClick?.({
                            preventDefault() { },
                        });
                    },
                },
            ],
        });

        povWindow.povRewritePopupFieldChange = function () {
            refreshPopupPromptPreview();
        };

        const fieldSelect = popupState.rewritePopup.dlg?.querySelector("#pov-rewrite-field-select");
        if (fieldSelect) {
            fieldSelect.addEventListener("change", () => {
                povWindow.povRewritePopupFieldChange();
            });
        }

        renderGreetingsSection();
        refreshPopupPromptPreview();

        const popupResult = await popupState.rewritePopup.show();

        delete povWindow.povRewritePopupFieldChange;
        popupState.characterData = null;

        if (popupResult === POPUP_RESULT.NEGATIVE && popupState.rewritePopupCloseHandler) {
            popupState.rewritePopupCloseHandler();
        }
    } catch (error) {
        console.error(`[${extensionName}] Error opening rewrite popup:`, error);
        toastr.error("Error: " + error.message);
    }
}
