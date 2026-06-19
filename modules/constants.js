export const extensionName = "SillyTavern-PovRewrite";
export const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

export const defaultSettings = {
    enabled: true,
    selectedProfileId: "",
    promptTemplate: `You are an expert editor specializing in narrative perspective conversion for character cards.

Task: Rewrite the character card field below into **first-person perspective**, as if the character is speaking about themselves.

Conversion rules:
1. The CHARACTER is now the narrator. Replace all third-person references to {{char}} (he/she/they/his/her/their) and any second-person "you are / your" descriptions OF the character with first-person equivalents (I/me/my/mine/myself).
2. The USER is always referred to as "you/your" — never "I/me." Do not change existing "you/your" that already refers to the user.
3. Only change what perspective conversion requires. Do not rephrase, summarize, add, or remove content.
4. Preserve all formatting, special tokens, and metadata exactly as-is.
5. In dialogue, only adjust pronouns that are clearly out-of-perspective — do not rewrite lines just to force consistency.

<source_text>
{{FIELD_TEXT}}
</source_text>`,
};

export const rewriteFieldKeys = [
    "description",
    "personality",
    "first_mes",
    "mes_example",
    "alternate_greetings",
];

export const fieldPreviewTitleByKey = {
    description: "Description",
    personality: "Personality",
    first_mes: "First Message",
    mes_example: "Example Messages",
    alternate_greetings: "Alternate Greetings",
};

export const fieldEditorSelectorByKey = {
    description: "#description_textarea",
    personality: "#personality_textarea",
    first_mes: "#firstmessage_textarea",
    mes_example: "#mes_example_textarea",
    alternate_greetings: "#alternate_greetings_template",
};
