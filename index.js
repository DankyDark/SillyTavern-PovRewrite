import { extension_settings } from "../../../extensions.js";
import { extensionName } from "./modules/constants.js";
import { initializeExtensionSettings, addSettingsUI } from "./modules/settings.js";
import { rewriteCharacterCard, setRewritePopupCloseHandler } from "./modules/ui.js";
import { registerGlobalRewriteHandlers, clearAbortController } from "./modules/rewrite-flow.js";

function addRewriteButton() {
    $(".pov-rewrite-button").remove();

    if (!extension_settings[extensionName].enabled) {
        return;
    }

    const buttonsBlock = $(".form_create_bottom_buttons_block");
    if (!buttonsBlock.length) {
        console.log(`[${extensionName}] Could not find buttons block.`);
        return;
    }

    const button = $("<div>", {
        id: "pov-rewrite-button",
        class: "menu_button fa-solid fa-comments pov-rewrite-button",
        title: "Rewrite character card to first-person perspective",
        click: rewriteCharacterCard,
    });

    const deleteButton = buttonsBlock.find("#favorite_button");
    if (deleteButton.length) {
        deleteButton.before(button);
    } else {
        buttonsBlock.append(button);
    }
}

async function initExtension() {
    try {
        initializeExtensionSettings();
        await addSettingsUI(addRewriteButton);

        if (!extension_settings[extensionName].enabled) {
            console.log(`[${extensionName}] Extension is disabled. Skipping active initialization.`);
            return;
        }

        registerGlobalRewriteHandlers();
        setRewritePopupCloseHandler(clearAbortController);
        addRewriteButton();
        console.log(`[${extensionName}] Extension initialized successfully.`);
    } catch (error) {
        console.error(`[${extensionName}] Error initializing extension:`, error);
    }
}

$(document).ready(function () {
    initExtension();
});
