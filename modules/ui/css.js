import { extensionFolderPath } from "../constants.js";

const CSS_LINK_ID = "pov-rewrite-ui-css";
const CSS_RELATIVE_PATH = "modules/ui/ui.css";

let injected = false;

export function loadUiCss() {
    if (injected || document.getElementById(CSS_LINK_ID)) {
        injected = true;
        return;
    }

    const link = document.createElement("link");
    link.id = CSS_LINK_ID;
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = `/${extensionFolderPath}/${CSS_RELATIVE_PATH}`;
    document.head.appendChild(link);
    injected = true;
}
