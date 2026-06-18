import { extension_settings, getContext } from "../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../script.js";
import { defaultSettings, extensionName, extensionFolderPath } from "./constants.js";
import { populateProfileSelect } from "./profile_manager.js";
import { registerGlobalRewriteHandlers, clearAbortController } from "./rewrite-flow.js";
import { setRewritePopupCloseHandler } from "./ui.js";

export function initializeExtensionSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    for (const [key, value] of Object.entries(defaultSettings)) {
        if (!Object.prototype.hasOwnProperty.call(extension_settings[extensionName], key)) {
            extension_settings[extensionName][key] = value;
            saveSettingsDebounced();
        }
    }
}

function loadSettings() {
    const isEnabled = !!extension_settings[extensionName].enabled;
    $("#pov-rewrite-enabled").prop("checked", isEnabled);
    $("#pov-rewrite-prompt").val(
        extension_settings[extensionName].promptTemplate,
    );
    populateProfileSelect(document.getElementById("pov-rewrite-profile"));
    applyConfigDisabledState(!isEnabled);
}

function applyConfigDisabledState(isDisabled) {
    const config = document.getElementById("pov-rewrite-config");
    if (!config) return;
    config.classList.toggle("pov-rewrite-config-disabled", isDisabled);
    config.querySelectorAll("input, select, textarea, button").forEach((el) => {
        el.disabled = isDisabled;
    });
}

function registerConnectionProfileRefresh() {
    try {
        const context = getContext();
        const { eventSource, eventTypes } = context;
        if (!eventSource || !eventTypes) return;

        const refresh = () => {
            const select = document.getElementById("pov-rewrite-profile");
            if (select) populateProfileSelect(select);
        };

        eventSource.on(eventTypes.CONNECTION_PROFILE_CREATED, refresh);
        eventSource.on(eventTypes.CONNECTION_PROFILE_UPDATED, refresh);
        eventSource.on(eventTypes.CONNECTION_PROFILE_LOADED, refresh);
    } catch (error) {
        console.warn(`[${extensionName}] Could not register connection profile refresh listener:`, error);
    }
}

export async function addSettingsUI(addRewriteButton) {
    try {
        const response = await fetch(`/${extensionFolderPath}/index.html`);
        if (!response.ok) {
            console.error(
                `[${extensionName}] Error loading settings HTML:`,
                response.statusText,
            );
            return;
        }

        const html = await response.text();
        $("#extensions_settings").append(html);
        loadSettings();
        registerConnectionProfileRefresh();

        $("#pov-rewrite-enabled").on("change", function () {
            extension_settings[extensionName].enabled = !!$(this).prop("checked");
            saveSettingsDebounced();
            applyConfigDisabledState(!extension_settings[extensionName].enabled);

            if (extension_settings[extensionName].enabled) {
                registerGlobalRewriteHandlers();
                setRewritePopupCloseHandler(clearAbortController);
            }
            addRewriteButton();
        });

        $("#pov-rewrite-prompt").on("input", function () {
            extension_settings[extensionName].promptTemplate = $(this).val();
            saveSettingsDebounced();
            document.dispatchEvent(new CustomEvent("pov-rewrite-template-changed"));
        });

        $("#pov-rewrite-reset-defaults").on("click", function () {
            extension_settings[extensionName].promptTemplate = defaultSettings.promptTemplate;
            extension_settings[extensionName].enabled = defaultSettings.enabled;
            saveSettingsDebounced();
            loadSettings();
            $("#pov-rewrite-enabled").trigger("change");
            document.dispatchEvent(new CustomEvent("pov-rewrite-template-changed"));
            toastr.success("POV Rewrite settings reset to defaults.");
        });
    } catch (error) {
        console.error(`[${extensionName}] Error adding settings:`, error);
    }
}
