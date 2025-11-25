# Section Library

This directory contains your Shopify section templates in JSON format.

## Template Structure

Each JSON file should follow this structure:

```json
{
  "id": "unique-template-id",
  "name": "Template Name",
  "description": "Template description",
  "tags": ["tag1", "tag2"],
  "type": "hero",
  "liquid_code": "Your Liquid template code here with {{variable}} placeholders",
  "variables": {
    "variable_name": {
      "type": "text|textarea|color",
      "default": "default value",
      "label": "Display Label",
      "description": "Optional description"
    }
  }
}
```

## Example Template

See `hero-banner.json` for a complete example.

## Adding Templates

1. Create a new JSON file in this directory
2. Follow the template structure above
3. Use `{{variable_name}}` placeholders in your Liquid code
4. Define all variables in the `variables` object
5. Restart your development server to load new templates

## Variable Types

- `text`: Single-line text input
- `textarea`: Multi-line text input
- `color`: Color picker (returns hex color)

## Notes

- Template IDs must be unique
- Variable names in Liquid code must match keys in the variables object
- The generator will replace `{{variable_name}}` with the user's input

