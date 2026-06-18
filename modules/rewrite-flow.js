import { getContext } from "../../../../extensions.js";
import { generateRaw, setExternalAbortController, eventSource, event_types } from "../../../../../script.js";
import { extensionName } from "./constants.js";
import { getCharacterData, buildRewritePrompt, restorePlaceholdersInString } from "./character-data.js";
import { parseRewriteResponse } from "./response-parser.js";
import { generateWithProfile, getSelectedProfileId } from "./profile_manager.js";
import {
    resetRewriteUIState,
    setRewriteLoadingState,
    setRewriteAbortedStatus,
    setRewriteErrorStatus,
    getPopupSelection,
    showPreviewDialog,
} from "./ui.js";

let abortController = null;
let abortRequested = false;
/** @type {Window & typeof globalThis & {
 *   povRewriteResetUI?: () => void,
 *   povRewriteStartClick?: (event: Event) => Promise<void>,
 *   povRewriteAbortClick?: (event: Event) => Promise<void>
 * }}
 */
const povWindow = window;

export function clearAbortController() {
    setExternalAbortController(null);
    abortController = null;
}

async function startRewriteFromPopup() {
    setRewriteLoadingState(true);
    abortRequested = false;
    abortController = new AbortController();
    setExternalAbortController(abortController);

    const context = getContext();
    if (!context.characterId) {
        throw new Error("No character selected");
    }

    const character = context.characters[context.characterId];
    const characterData = getCharacterData(character);

    const { fieldKey, greetingIndexes } = getPopupSelection();
    if (!fieldKey) {
        throw new Error("Select a field to rewrite");
    }
    if (fieldKey === "alternate_greetings" && (!greetingIndexes || greetingIndexes.length === 0)) {
        throw new Error("Select at least one greeting to rewrite");
    }

    const prompt = buildRewritePrompt(characterData, fieldKey, greetingIndexes);
    const response = await requestRewriteResponse(prompt, fieldKey);

    if (abortRequested || abortController === null) {
        throw new Error("Operation aborted");
    }

    await handleAIResponse(response, character, fieldKey, greetingIndexes);
    clearAbortController();
}

async function requestRewriteResponse(prompt, fieldKey) {
    const schema = getRewriteJsonSchema(fieldKey);
    const signal = abortController?.signal ?? null;
    const profileId = getSelectedProfileId();
    if (profileId) {
        const result = await generateWithProfile(profileId, prompt, { jsonSchema: schema, signal });
        return result.text;
    }
    return await generateRaw({
        prompt: prompt,
        jsonSchema: schema,
        trimNames: false,
    });
}

function getRewriteJsonSchema(fieldKey) {
    const propertyValue = fieldKey === "alternate_greetings"
        ? { type: "array", items: { type: "string" } }
        : { type: "string" };

    return {
        name: "pov_rewrite_field",
        description: "The rewritten character card field in first-person perspective.",
        value: {
            type: "object",
            properties: {
                [fieldKey]: propertyValue,
            },
            required: [fieldKey],
            additionalProperties: false,
        },
        strict: false,
        returnInvalid: true,
    };
}

async function abortRewriteFromPopup() {
    if (!abortController) return;
    abortRequested = true;

    abortController.abort();

    await eventSource.emit(event_types.GENERATION_STOPPED);

    clearAbortController();
    resetRewriteUIState();
    setRewriteAbortedStatus();
    toastr.info("Rewrite aborted by user");
}

async function handleAIResponse(response, currentCharacter, fieldKey, greetingIndexes) {
    try {
        const rewrittenData = parseRewriteResponse(response, currentCharacter, fieldKey);
        if (!rewrittenData || typeof rewrittenData !== "object") {
            throw new Error("Invalid response format");
        }

        const restoredValue = restoreFieldPlaceholders(rewrittenData[fieldKey], fieldKey);
        await showPreviewDialog({ [fieldKey]: restoredValue }, currentCharacter, fieldKey, greetingIndexes);
        resetRewriteUIState();
    } catch (error) {
        console.error(`[${extensionName}] Error handling AI response:`, error);
        toastr.error("Error: " + error.message);
        resetRewriteUIState();
    }
}

function restoreFieldPlaceholders(value, fieldKey) {
    if (fieldKey === "alternate_greetings") {
        if (!Array.isArray(value)) return [];
        return value.map((item) => restorePlaceholdersInString(String(item ?? "")));
    }
    return restorePlaceholdersInString(String(value ?? ""));
}

export function registerGlobalRewriteHandlers() {
    povWindow.povRewriteResetUI = resetRewriteUIState;

    povWindow.povRewriteStartClick = async function (event) {
        event.preventDefault();
        try {
            await startRewriteFromPopup();
        } catch (error) {
            const wasAbort = abortRequested || error.name === "AbortError" || error.type === "aborted" || abortController === null;
            clearAbortController();

            if (wasAbort) {
                if (!abortRequested) {
                    toastr.info("Rewrite aborted by user");
                }
                setRewriteAbortedStatus();
            } else {
                console.error(`[${extensionName}] Generation failed with error:`, error);
                toastr.error("Error: " + error.message);
                setRewriteErrorStatus(error.message);
            }

            setRewriteLoadingState(false);
            abortRequested = false;
        }
    };

    povWindow.povRewriteAbortClick = async function (event) {
        event.preventDefault();
        await abortRewriteFromPopup();
    };
}
