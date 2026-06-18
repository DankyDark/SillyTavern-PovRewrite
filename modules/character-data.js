import { extension_settings } from "../../../../extensions.js";
import {
    defaultSettings,
    extensionName,
} from "./constants.js";

function escapeMacrosInText(text) {
    if (typeof text !== "string") return text;
    return text
        .replace(/{{\s*char\s*}}/gi, "\\{\\{char\\}\\}")
        .replace(/{{\s*user\s*}}/gi, "\\{\\{user\\}\\}");
}

function unescapeMacrosInText(text) {
    if (typeof text !== "string") return text;
    return text.replace(/\\([{}])/g, "$1");
}

export function getCharacterData(character) {
    const data = character.data || {};
    return {
        name: data.name || character.name || "",
        description: data.description || "",
        personality: data.personality || "",
        scenario: data.scenario || "",
        first_mes: data.first_mes || character.first_mes || "",
        mes_example: data.mes_example || character.mes_example || "",
        alternate_greetings: data.alternate_greetings || [],
        creator_notes: data.creator_notes || "",
        post_history_instructions: data.post_history_instructions || "",
        system_prompt: data.system_prompt || "",
        tags: data.tags || [],
    };
}

export function getFieldValueForRewrite(characterData, fieldKey, selectedGreetingIndexes = null) {
    if (fieldKey === "alternate_greetings") {
        const greetings = Array.isArray(characterData.alternate_greetings)
            ? characterData.alternate_greetings
            : [];
        const indexes = Array.isArray(selectedGreetingIndexes) && selectedGreetingIndexes.length
            ? selectedGreetingIndexes
            : greetings.map((_, i) => i);
        return indexes
            .filter((i) => i >= 0 && i < greetings.length)
            .map((i) => ({
                index: i,
                text: escapeMacrosInText(String(greetings[i] ?? "")),
            }));
    }

    const raw = characterData[fieldKey];
    return escapeMacrosInText(typeof raw === "string" ? raw : "");
}

export function getAvailableFields(characterData) {
    if (!characterData) return [];
    const available = [];
    for (const key of ["description", "personality", "first_mes", "mes_example"]) {
        const value = characterData[key];
        if (typeof value === "string" && value.trim() !== "") {
            available.push(key);
        }
    }
    const greetings = Array.isArray(characterData.alternate_greetings)
        ? characterData.alternate_greetings
        : [];
    if (greetings.some((g) => typeof g === "string" && g.trim() !== "")) {
        available.push("alternate_greetings");
    }
    return available;
}

function formatFieldTextForPrompt(fieldKey, value) {
    if (fieldKey === "alternate_greetings") {
        return value
            .map((entry) => `--- Greeting ${entry.index + 1} ---\n${entry.text}`)
            .join("\n\n");
    }
    return String(value);
}

function buildOutputFormatInstructions(fieldKey) {
    if (fieldKey === "alternate_greetings") {
        return `Return ONLY a valid JSON object with a single "alternate_greetings" key. Its value MUST be a JSON array of strings, one per greeting listed above, in the same order, WITHOUT any "--- Greeting N ---" headers. Do not include any explanations or additional text.`;
    }

    return `Return ONLY a valid JSON object with a single "${fieldKey}" key. Its value MUST be a single string. Do not include any explanations or additional text.`;
}

export function buildRewritePrompt(characterData, fieldKey, selectedGreetingIndexes = null) {
    let prompt = extension_settings[extensionName].promptTemplate || defaultSettings.promptTemplate;
    const value = getFieldValueForRewrite(characterData, fieldKey, selectedGreetingIndexes);

    prompt = prompt.replaceAll("{{FIELD_KEY}}", fieldKey);
    prompt = prompt.replaceAll("{{FIELD_TEXT}}", formatFieldTextForPrompt(fieldKey, value));
    prompt = `${prompt.trimEnd()}\n\n${buildOutputFormatInstructions(fieldKey)}`;
    return prompt;
}

export function restorePlaceholdersInString(str) {
    if (!str || typeof str !== "string") return str;
    return unescapeMacrosInText(str);
}
