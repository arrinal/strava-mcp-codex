# Troubleshooting

## Check local config

```bash
strava-mcp-codex config paths
strava-mcp-codex config show
strava-mcp-codex auth status
```

## `MCP Authorize client_id invalid`

Update to the latest version and check:

```bash
strava-mcp-codex config show
```

The authorize URL should be:

```text
https://www.strava.com/oauth/authorize
```

If it shows this old value, reinstall the latest package and reset stale config:

```text
https://www.strava.com/oauth/mcp/authorize
```

Reset config:

```bash
rm ~/.config/strava-mcp-codex/config.json
strava-mcp-codex config set-client --client-id YOUR_CLIENT_ID --client-secret YOUR_CLIENT_SECRET
strava-mcp-codex login
```

## 401 or invalid token

Run login again:

```bash
strava-mcp-codex login
strava-mcp-codex health
```

The bridge refreshes tokens automatically and retries once after upstream 401. If refresh still fails, the refresh token may be invalid or revoked.

## Callback port busy

Default callback URL:

```text
http://127.0.0.1:8765/callback
```

Stop the process using that port, or change the callback port in config and update your Strava app callback settings.

## Browser did not open during login

Use:

```bash
strava-mcp-codex login --no-open-browser
```

Then paste the printed authorization URL into your browser.

## Codex cannot see Strava tools

Check the CLI:

```bash
which strava-mcp-codex
strava-mcp-codex --help
```

Check Codex config:

```bash
strava-mcp-codex codex status
strava-mcp-codex codex install --dry-run
```

If using npx mode, make sure Node/npm are available in the environment that launches Codex.

If using global mode, make sure `strava-mcp-codex` is on the PATH visible to Codex.

## Strava rate limit

This bridge forwards requests to the Strava MCP. Reduce polling/fanout and retry later.

## Before opening an issue

Include:

- command you ran
- redacted output
- Node.js version
- OS
- whether you use global install or npx mode

Do not include access tokens, refresh tokens, client secrets, or Authorization headers.
