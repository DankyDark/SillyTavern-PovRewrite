export const extensionName = "SillyTavern-PovRewrite";
export const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

export const defaultSettings = {
    enabled: true,
    selectedProfileId: "",
    promptTemplate: `You are an expert at converting character card text between narrative perspectives.

Task: Rewrite the provided character card field from its current perspective (second-person or third-person) to first-person perspective.

Pronouns to use:
- I, me, my, mine, myself (for the character)
- We, us, our, ours (if applicable)

Rules:
PRIMARY OBJECTIVE: Focus ONLY on the PERSPECTIVE! Only change TENSE where necessary to reflect first-person POV.
1. Convert all references to the {{char}} from "he/she/they/you" to "I/my/me."
2. Convert all references to the {{user}} from "I/my/me" to "you" UNLESS used in dialogue where it makes sense.
3. Keep the character name unchanged.
4. Preserve all metadata and formatting.

Source text:
{{FIELD_TEXT}}`,
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
