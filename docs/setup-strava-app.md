# Strava app setup

Strava MCP Codex uses your own Strava API app credentials.

## 1. Create a Strava API app

Create a Strava API app from your Strava account.

Keep these values available:

- Client ID
- Client Secret

Do not share the client secret publicly.

## 2. Callback settings

The CLI uses this local redirect URL during login:

```text
http://127.0.0.1:8765/callback
```

If Strava asks for an authorization callback domain, use:

```text
127.0.0.1
```

or:

```text
localhost
```

Depending on Strava's current app settings UI, you may only need to enter the callback domain, not the full URL.

## 3. Save credentials locally

```bash
strava-mcp-codex config set-client \
  --client-id YOUR_CLIENT_ID \
  --client-secret YOUR_CLIENT_SECRET
```

## 4. Login

```bash
strava-mcp-codex login
```

If the browser does not open automatically:

```bash
strava-mcp-codex login --no-open-browser
```

Then paste the printed URL into your browser.

## 5. Verify

```bash
strava-mcp-codex health
strava-mcp-codex tools
```
