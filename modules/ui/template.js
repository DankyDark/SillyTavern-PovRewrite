import { extension_settings } from "../../../../../extensions.js";
import { extensionName, defaultSettings } from "../constants.js";
import { REQUIRED_PLACEHOLDERS } from "./state.js";

export function getActivePromptTemplate() {
    const template = extension_settings[extensionName]?.promptTemplate;
    return typeof template === "string" && template.trim() ? template : defaultSettings.promptTemplate;
}

export function getMissingPlaceholders() {
    const template = getActivePromptTemplate();
    return REQUIRED_PLACEHOLDERS.filter((placeholder) => !template.includes(placeholder));
}

export function truncate(text, length) {
    const clean = String(text ?? "").replace(/\s+/g, " ").trim();
    return clean.length > length ? `${clean.slice(0, length)}…` : clean;
}
