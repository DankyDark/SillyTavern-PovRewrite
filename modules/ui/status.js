import { escapeHtml } from "../utils.js";
import { getRewritePopupElements } from "./elements.js";
import { setRewriteLoadingState } from "./loading.js";

export const rewriteStatusMarkup = {
    ready: null,
    aborted: '<i class="fa-solid fa-times-circle"></i><span>Rewrite aborted</span>',
    error: (message) => `<i class="fa-solid fa-exclamation-circle"></i><span>Error: ${escapeHtml(message)}</span>`,
    warning: (message) => `<i class="fa-solid fa-triangle-exclamation"></i><span>${escapeHtml(message)}</span>`,
};

export function updateRewriteStatus(statusHtml) {
    const { statusEl } = getRewritePopupElements();
    if (!statusEl) return;

    if (statusHtml === null || statusHtml === undefined || statusHtml === "") {
        statusEl.classList.add("hidden");
        statusEl.innerHTML = "";
        statusEl.classList.remove("pov-rewrite-status-warning");
        return;
    }

    statusEl.classList.remove("hidden");
    statusEl.innerHTML = statusHtml;
    statusEl.classList.toggle("pov-rewrite-status-warning", statusHtml.includes("fa-triangle-exclamation"));
}

export function resetRewriteUIState() {
    setRewriteLoadingState(false);
    updateRewriteStatus(rewriteStatusMarkup.ready);
}

export function setRewriteAbortedStatus() {
    updateRewriteStatus(rewriteStatusMarkup.aborted);
}

export function setRewriteErrorStatus(message) {
    updateRewriteStatus(rewriteStatusMarkup.error(message));
}
