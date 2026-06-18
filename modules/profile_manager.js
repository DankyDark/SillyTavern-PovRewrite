import { extension_settings, getContext } from "../../../../extensions.js";
import { saveSettingsDebounced, CONNECT_API_MAP } from "../../../../../script.js";
import { extensionName } from "./constants.js";

const PROFILE_MAX_TOKENS = 8192;

function getPersistedProfileId() {
    return extension_settings[extensionName]?.selectedProfileId || "";
}

function setPersistedProfileId(profileId) {
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = {};
    }
    extension_settings[extensionName].selectedProfileId = profileId || "";
    saveSettingsDebounced();
}

export function isConnectionManagerAvailable() {
    try {
        const context = getContext();
        if (context.extensionSettings.disabledExtensions.includes("connection-manager")) {
            return false;
        }
        return !!context.extensionSettings.connectionManager?.profiles;
    } catch {
        return false;
    }
}

function buildProfileDropdown(select) {
    const context = getContext();
    const profiles = context.extensionSettings.connectionManager.profiles || [];
    const persistedId = getPersistedProfileId();

    select.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Default (current API)";
    select.appendChild(defaultOption);

    const chatCompletionProfiles = profiles
        .filter((profile) => {
            const apiMap = CONNECT_API_MAP[profile.api];
            return apiMap?.selected === "openai";
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    for (const profile of chatCompletionProfiles) {
        const option = document.createElement("option");
        option.value = profile.id;
        option.textContent = profile.name;
        select.appendChild(option);
    }

    const selectedProfile = profiles.find((p) => p.id === persistedId);
    const apiMap = selectedProfile ? CONNECT_API_MAP[selectedProfile.api] : null;
    select.value = (apiMap?.selected === "openai") ? persistedId : "";

    select.addEventListener("change", () => {
        setPersistedProfileId(select.value || "");
    });
}

export function populateProfileSelect(select) {
    if (!select) return;

    if (!isConnectionManagerAvailable()) {
        select.innerHTML = "";
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Connection Manager unavailable";
        select.disabled = true;
        select.appendChild(option);
        return;
    }

    try {
        buildProfileDropdown(select);
    } catch (error) {
        console.error("[SillyTavern-PovRewrite] Failed to build profile dropdown:", error);
        select.innerHTML = "";
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Profile list error";
        select.disabled = true;
        select.appendChild(option);
    }
}

export function getSelectedProfileId() {
    const id = getPersistedProfileId();
    if (!id) return null;

    if (!isConnectionManagerAvailable()) return null;

    const context = getContext();
    const profiles = context.extensionSettings.connectionManager.profiles || [];
    const profile = profiles.find((p) => p.id === id);
    if (!profile) return null;

    const apiMap = CONNECT_API_MAP[profile.api];
    return apiMap?.selected === "openai" ? id : null;
}

export async function generateWithProfile(profileId, prompt, { jsonSchema = null, signal = null } = {}) {
    const context = getContext();
    if (!context.ConnectionManagerRequestService) {
        throw new Error("Connection Manager is not available");
    }

    // Profile API doesn't run SillyTavern's macro post-processor, so strip the
    // backslash escapes we added for the generateRaw path. After this strip,
    // both routes send clean {{char}}/{{user}} to the AI.
    const unescapedPrompt = prompt.replace(/\\([{}])/g, "$1");
    const messages = [{ role: "user", content: unescapedPrompt }];

    const response = await context.ConnectionManagerRequestService.sendRequest(
        profileId,
        messages,
        PROFILE_MAX_TOKENS,
        {
            stream: false,
            signal,
            extractData: true,
            includePreset: true,
            includeInstruct: true,
            jsonSchema,
        },
        {},
    );

    if (!response || typeof response.content !== "string") {
        throw new Error("Invalid response format from profile generation");
    }

    return {
        text: response.content,
        reasoning: response.reasoning || "",
    };
}
