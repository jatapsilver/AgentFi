# N8N Workflows

This directory contains version-controlled n8n workflow definitions exported as JSON files.

## Structure

- `v1/` - Initial workflow versions
- Future versions can be organized in separate folders (v2/, v3/, etc.)

## Usage

### Exporting workflows from n8n

1. Open your workflow in n8n (http://localhost:5678)
2. Click the workflow menu (three dots) → **Download**
3. Save the JSON file to the appropriate version folder
4. Commit the file to git

### Importing workflows to n8n

1. Open n8n (http://localhost:5678)
2. Click **Workflows** → **Import from File**
3. Select the JSON file from this directory
4. Activate and test the workflow

## Best Practices

- Export workflows after significant changes
- Use descriptive filenames: `workflow-name-v1.json`
- Document workflow purpose and dependencies in commit messages
- Keep one workflow per file
- Never commit sensitive credentials (use n8n's credential system)

## Version History

### v1

- Initial workflow collection for AgentFi project
- Contains DeFi automation flows for 1inch and Pyth integrations
