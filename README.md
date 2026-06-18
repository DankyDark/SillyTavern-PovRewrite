# NOTE
While you are free to use this extension however you see fit, I made this for personal use so it may be buggy or not work for you. At the moment it's not something I plan to release officially, but if you do use it and find issues you can reach out to me. Otherwise, feel free to fork and modify it as needed.

> This extension is a little buggy and experimental, use at your own risk. I'm still working out some kinks.

## POV Rewrite Extension for SillyTavern

Convert character cards to first-person perspective using AI.

## Installation

1. Install: Extensions → Install extension → `https://github.com/DankyDark/SillyTavern-PovRewrite`
2. Open any character and find the "💬" button

## Usage

1. Open a character in edit mode
2. Click the comments icon (💬) in the character panel
3. Pick a field to rewrite from the dropdown (Description, Personality, First Message, Example Messages, or Alternate Greetings)
4. If you pick Alternate Greetings, pick the single greeting to rewrite from the dropdown
5. Review the prompt preview on the right
6. Click "Start Rewrite"
7. Wait for the AI to process
8. Preview and apply changes

Each rewrite targets exactly one field (or a single greeting) for a clean, unambiguous request. Run the tool again for additional fields or greetings.

## Settings

- **Enable Extension**: Show/hide the rewrite button. When disabled, the rest of the settings panel is grayed out.
- **Connection Profile**: Pick a connection profile from the Connection Manager extension to run rewrites through. Leave on "Default (current API)" to use your currently active connection.
- **Prompt Template**: Customize the conversion prompt. Placeholder:
  - `{{FIELD_TEXT}}` - the source text to rewrite (required)

The output format (JSON, array vs single string) is handled automatically based on the selected field. You don't need to include any return-format instructions in your template.

## How It Works

1. Extracts the selected field (or the single chosen greeting) from the character card
2. Sends a single-field rewrite request to your configured AI model
3. Receives the rewritten value as JSON, constrained by a strict schema for that field
4. For Alternate Greetings, only the selected greeting index is replaced; others are left untouched
5. Preserves character name, tags, and other metadata

## Requirements

- SillyTavern with AI backend configured
- AI model that supports JSON output (OpenAI, Claude, etc.)
- **Experimental Macro Engine enabled** (User Settings → it's on by default). Required so `{{char}}`/`{{user}}` macros in card text survive the rewrite intact. If disabled, the macros may be mangled during rewrite.

## Troubleshooting

**Button not visible**: Enable the extension in the POV Rewrite settings panel.

**AI errors**: Ensure your AI backend is properly configured. The extension expects the model to return a JSON object with the rewritten field.

**Poor quality output**: Adjust the prompt template in extension settings. For Alternate Greetings, the extension sends one greeting at a time for more reliable parsing.

**`{{char}}`/`{{user}}` macros get mangled or replaced with names**: Ensure the Experimental Macro Engine is enabled in User Settings.

## License

MIT License

## Author

DankyDark