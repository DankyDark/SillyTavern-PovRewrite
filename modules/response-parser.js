import { rewriteFieldKeys } from "./constants.js";

function sanitizeJsonStringValues(jsonString) {
    let result = jsonString
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, "\"")
        .replace(/[\u2018\u2019\u201A\u201B\u2039\u203A]/g, "'");

    let i = 0;
    let finalResult = "";

    while (i < result.length) {
        const char = result[i];
        if (char === "\"") {
            let str = "\"";
            i++;
            let inEscape = false;

            while (i < result.length) {
                const c = result[i];
                if (inEscape) {
                    str += c;
                    inEscape = false;
                    i++;
                } else if (c === "\\") {
                    str += c;
                    inEscape = true;
                    i++;
                } else if (c === "\"") {
                    let nextNonSpaceIdx = i + 1;
                    while (nextNonSpaceIdx < result.length && /\s/.test(result[nextNonSpaceIdx])) {
                        nextNonSpaceIdx++;
                    }

                    const nextChar = nextNonSpaceIdx < result.length ? result[nextNonSpaceIdx] : "";
                    if (nextChar === ":" || nextChar === "," || nextChar === "}" || nextChar === "]") {
                        str += c;
                        i++;
                        break;
                    }

                    str += "\\\"";
                    i++;
                } else if (c === "\n") {
                    str += "\\n";
                    i++;
                } else if (c === "\r") {
                    str += "\\r";
                    i++;
                } else if (c === "\t") {
                    str += "\\t";
                    i++;
                } else {
                    str += c;
                    i++;
                }
            }

            finalResult += str;
        } else {
            finalResult += char;
            i++;
        }
    }

    return finalResult;
}

function stripMarkdownCodeBlock(text) {
    return String(text || "")
        .replace(/^```(?:json|JSON)?\s*/i, "")
        .replace(/\s*```$/g, "")
        .trim();
}

function extractLikelyJsonObject(rawText) {
    const text = stripMarkdownCodeBlock(rawText);
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        return null;
    }

    return text.slice(firstBrace, lastBrace + 1);
}

function parseJsonFromText(rawText, parseErrorContext) {
    const normalizedText = stripMarkdownCodeBlock(rawText);

    try {
        return JSON.parse(normalizedText);
    } catch {
        const extractedJson = extractLikelyJsonObject(normalizedText);
        if (!extractedJson) {
            throw new Error("No valid JSON found in AI response");
        }

        try {
            return JSON.parse(sanitizeJsonStringValues(extractedJson));
        } catch (fallbackError) {
            throw new Error(`${parseErrorContext}: ${fallbackError.message}`);
        }
    }
}

function parseRewriteModelContent(content) {
    return parseJsonFromText(stripMarkdownCodeBlock(content), "Could not parse JSON from AI response");
}

function isChatCompletionResponse(payload) {
    return !!payload?.choices && Array.isArray(payload.choices) && payload.choices.length > 0;
}

function getChatCompletionContent(payload) {
    const message = payload.choices[0]?.message || {};
    return message.content || message.reasoning || "";
}

function unwrapResponsePayload(response) {
    if (isChatCompletionResponse(response)) {
        return parseRewriteModelContent(getChatCompletionContent(response));
    }

    if (typeof response === "string") {
        const parsedStringPayload = parseJsonFromText(response, "Could not parse JSON from AI response");
        return unwrapResponsePayload(parsedStringPayload);
    }

    return response;
}

function normalizeStringValue(value) {
    if (Array.isArray(value)) {
        return value.join("\n");
    }
    return typeof value === "string" ? value : "";
}

function splitGreetingString(value) {
    const text = String(value ?? "");
    if (!text.trim()) {
        return [];
    }
    const parts = text.split(/^---\s*Greeting\s+\d+\s*---\s*$/im);
    return parts
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
}

function normalizeGreetingArray(value) {
    if (Array.isArray(value)) {
        return value
            .filter((item) => item !== undefined && item !== null)
            .map((item) => String(item));
    }

    if (typeof value === "string" || typeof value === "number") {
        return splitGreetingString(value);
    }

    return [];
}

export function parseRewriteResponse(response, _currentCharacter, fieldKey) {
    const unwrappedResponse = unwrapResponsePayload(response);

    if (typeof unwrappedResponse !== "object" || unwrappedResponse === null) {
        throw new Error("Invalid response format from AI");
    }

    const expectedKey = fieldKey && rewriteFieldKeys.includes(fieldKey) ? fieldKey : null;
    let resolvedKey = expectedKey;
    let rawValue;

    if (expectedKey && unwrappedResponse[expectedKey] !== undefined) {
        rawValue = unwrappedResponse[expectedKey];
    } else {
        const presentKeys = rewriteFieldKeys.filter((k) => unwrappedResponse[k] !== undefined);
        if (presentKeys.length === 1) {
            resolvedKey = presentKeys[0];
            rawValue = unwrappedResponse[resolvedKey];
        }
    }

    if (resolvedKey === null || rawValue === undefined) {
        throw new Error("AI response does not contain the expected rewrite field");
    }

    const normalizedValue = resolvedKey === "alternate_greetings"
        ? normalizeGreetingArray(rawValue)
        : normalizeStringValue(rawValue);

    return { [resolvedKey]: normalizedValue };
}
