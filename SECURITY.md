# Security Policy

## Supported versions

Security updates are provided for the latest published version of `strava-mcp-codex`.

## Reporting a vulnerability

Please use GitHub private vulnerability reporting if it is available for this repository. If private reporting is not available, contact the repository owner privately before opening a public issue.

Do not post access tokens, refresh tokens, client secrets, or Authorization headers in public issues, logs, screenshots, or pull requests.

## Token handling

Strava MCP Codex stores tokens locally by default under:

```text
~/.config/strava-mcp-codex/auth.json
```

The file is written with private permissions where supported. Token-like fields and Authorization headers are redacted from normal CLI output, but you should still review logs before sharing them.

## Scope

This project does not operate a hosted token broker or backend service. Security reports should focus on the local CLI, local config/token storage, OAuth flow handling, MCP forwarding behavior, and accidental secret disclosure.
