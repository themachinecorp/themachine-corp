# agent-browser

Fast browser automation CLI for AI agents.

## Install
```bash
npm install -g agent-browser
```

## Commands

| Command | Description |
|---------|-------------|
| `open <url>` | Navigate to URL |
| `click <sel>` | Click element |
| `type <sel> <text>` | Type text |
| `fill <sel> <text>` | Clear and fill |
| `press <key>` | Press key |
| `hover <sel>` | Hover element |
| `check <sel>` | Check checkbox |
| `select <sel> <val>` | Select dropdown |
| `screenshot` | Take screenshot |
| `snapshot` | Get DOM snapshot |

## Options
- `--profile <name>` - Browser profile
- `--headless` - Run headless

## Usage
```bash
agent-browser open https://example.com
agent-browser click "#submit"
agent-browser type "#search" "query"
agent-browser screenshot
```
