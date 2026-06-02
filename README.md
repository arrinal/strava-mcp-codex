# Strava MCP Codex

Use Strava MCP from Codex or any MCP client that supports local stdio servers.

Strava MCP Codex runs locally on your machine. It handles Strava OAuth, stores tokens locally, and forwards MCP requests to `https://mcp.strava.com/mcp`.

## Prerequisites

Before installing, make sure you have:

- **Node.js 20 or newer**
  - Node.js 22 LTS or newer is recommended.
  - Check with `node --version`.
- **npm 9 or newer**
  - npm 10 or newer is recommended.
  - Check with `npm --version`.
- **A Strava account** with access to the activities you want to read.
- **Your own Strava API app credentials**
  - Client ID
  - Client Secret
  - Create/manage apps from your Strava account settings.
- **Local callback access** for OAuth login
  - Callback host/domain: `127.0.0.1` or `localhost`
  - Redirect URL used by the CLI: `http://127.0.0.1:8765/callback`
  - Port `8765` must be available during `strava-mcp-codex login`.
- **Outbound HTTPS access** to Strava:
  - `https://www.strava.com`
  - `https://mcp.strava.com/mcp`
- **An MCP client that supports local stdio servers**, if you want agent/client integration
  - Examples: Codex, OpenClaw, Hermes, or another MCP-compatible client.
  - The MCP server command is `strava-mcp-codex` with no args.

No Python, Docker, database, hosted token broker, or Claude account is required.

## Install

Choose one setup path.

### Manual terminal

Install the CLI globally:

```bash
npm install -g strava-mcp-codex
```

Verify the CLI is available:

```bash
strava-mcp-codex --help
```

Then continue with the [Quickstart](https://github.com/arrinal/strava-mcp-codex?tab=readme-ov-file#quickstart) below to add your Strava API app credentials, login, verify access, and install MCP config for your client.

### Paste to your AI agent

If you use an AI agent such as OpenClaw, Hermes, or another coding assistant with terminal access, paste this prompt and replace the credential placeholders first.

```text
Install Strava MCP Codex and connect it to my MCP client end-to-end.

Goal:
- Install `strava-mcp-codex` globally with npm.
- Configure it with my Strava API app credentials.
- Complete Strava OAuth login.
- Verify `health` and `tools` work.
- Add an MCP server named `strava` to my MCP client/system.
- Verify the MCP client/system can see and use the Strava tools.

Credentials:
- Strava Client ID: <PASTE_CLIENT_ID_HERE>
- Strava Client Secret: <PASTE_CLIENT_SECRET_HERE>

MCP clients/systems to integrate:
- <PASTE_ONE_OR_MORE: Codex, OpenClaw, Hermes, other>

Steps:
1. Check prerequisites:
   - Node.js 20 or newer; Node.js 22 LTS or newer recommended.
   - npm 9 or newer; npm 10 or newer recommended.
   - Strava account and Strava API app Client ID/Client Secret.
   - Local callback host `127.0.0.1` or `localhost`; port `8765` available for login.
   - Outbound HTTPS access to `www.strava.com` and `mcp.strava.com`.
   - MCP client/system supports local stdio MCP servers if integration is requested.
2. Run `npm install -g strava-mcp-codex`.
3. Run `strava-mcp-codex --help` to verify the CLI is available.
4. Run `strava-mcp-codex config set-client --client-id <CLIENT_ID> --client-secret <CLIENT_SECRET>`.
5. Run `strava-mcp-codex login` and help me complete browser authorization if needed.
6. Run `strava-mcp-codex health` and verify it succeeds.
7. Run `strava-mcp-codex tools` and summarize the available Strava MCP tools.
8. Add this local stdio MCP server to each selected MCP client/system:
   - Server name: `strava`
   - Command: `strava-mcp-codex`
   - Args: none
9. If Codex is selected, run `strava-mcp-codex codex install --dry-run`, show me the planned config change, then run `strava-mcp-codex codex install` if it looks safe.
10. If OpenClaw is selected, add the equivalent MCP config under `mcp.servers.strava` with command `strava-mcp-codex`, preserving existing config and restarting/reloading OpenClaw only if required.
11. If Hermes is selected, add the equivalent Hermes MCP server entry using its documented MCP config format: server name `strava`, command `strava-mcp-codex`, no args.
12. If any other MCP client is selected, use its documented local stdio MCP server config format with server name `strava` and command `strava-mcp-codex`.
13. It is OK to integrate more than one client in the same run, for example Codex + OpenClaw, Codex + Hermes, OpenClaw + Hermes, or all three.
14. Verify each selected MCP client/system can list or call the Strava tools, for example `health` and `list_activities` if available.
15. Tell me the final status per client and any remaining manual step, such as restarting an MCP client or starting a new agent session.

Security:
- Do not print or log my client secret, access token, refresh token, or Authorization header.
- Do not commit credentials to git.
- Preserve existing MCP/client config; do not overwrite unrelated servers.
- If editing app config or restarting a service could be disruptive, explain the change first.
- If anything fails, show the error with secrets redacted and explain the next step.
```

After the agent finishes, you should see successful `health` and `tools` output, plus confirmation for each MCP client/system you selected. If the agent stops early, continue manually from the matching Quickstart step below.

## Quickstart

### 1. Create a Strava API app

Create a Strava API app from your Strava account.

You need:

- Client ID
- Client Secret

Keep the client secret private. Do not paste it into GitHub issues, chats, screenshots, or logs.

If Strava asks for an authorization callback domain, use one of these local callback hosts:

```text
127.0.0.1
localhost
```

The CLI uses this redirect URL during login:

```text
http://127.0.0.1:8765/callback
```

Depending on Strava's current app settings UI, you may only need to set the callback domain, not the full URL.

### 2. Save your Strava app credentials locally

```bash
strava-mcp-codex config set-client \
  --client-id YOUR_CLIENT_ID \
  --client-secret YOUR_CLIENT_SECRET
```

### 3. Login to Strava

```bash
strava-mcp-codex login
```

Your browser will open Strava's authorization page. Approve the requested scopes and return to the CLI.

If the browser does not open automatically:

```bash
strava-mcp-codex login --no-open-browser
```

Then copy the printed URL into your browser manually.

### 4. Verify Strava MCP access

```bash
strava-mcp-codex health
strava-mcp-codex tools
```

`health` should report successful auth/token checks and `tools` should list the Strava MCP tools available to your account.

### 5. Add Strava MCP to Codex

Preview the Codex config change first:

```bash
strava-mcp-codex codex install --dry-run
```

If it looks correct, install it:

```bash
strava-mcp-codex codex install
```

Then restart Codex and use the Strava MCP tools from Codex.

## What Strava MCP tools can do

Available tools may vary by account, scopes, and Strava MCP updates. Common capabilities include:

- Check MCP/API eligibility and health
- Read athlete profile information
- Read athlete heart-rate zones
- List recent activities
- Inspect activity performance details
- Fetch activity streams such as time, distance, heart rate, cadence, watts, altitude, and GPS lat/lng when available
- Read gear details
- Read club information

Typical use cases:

- Ask Codex to summarize recent runs or rides
- Compare activity effort and performance
- Inspect heart-rate zones and training signals
- Pull activity streams for deeper analysis
- Combine Strava activity data with your local project notes or training plans

## Commands

```bash
strava-mcp-codex login
strava-mcp-codex logout
strava-mcp-codex auth status
strava-mcp-codex config show
strava-mcp-codex config paths
strava-mcp-codex config set-client --client-id ... --client-secret ...
strava-mcp-codex health
strava-mcp-codex tools
strava-mcp-codex doctor
strava-mcp-codex codex install
strava-mcp-codex codex status
strava-mcp-codex codex uninstall
```

Running `strava-mcp-codex` with no subcommand starts the stdio MCP server.

## Codex configuration

Global install mode writes this server entry:

```toml
[mcp_servers.strava]
command = "strava-mcp-codex"
```

You can also use npx mode:

```bash
strava-mcp-codex codex install --mode npx
```

Which writes:

```toml
[mcp_servers.strava]
command = "npx"
args = ["-y", "strava-mcp-codex"]
```

Use `--dry-run` before writing if you want to inspect the generated config.

## Local files

Default local paths:

- Config: `~/.config/strava-mcp-codex/config.json`
- Auth tokens: `~/.config/strava-mcp-codex/auth.json`

Environment overrides:

- `STRAVA_MCP_CODEX_CONFIG`
- `STRAVA_MCP_CODEX_AUTH`
- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`

Config and auth files are written with private permissions where supported.

## Requested Strava scopes

The CLI requests these scopes during login:

- `read`
- `read_all`
- `activity:read`
- `activity:read_all`
- `profile:read_all`

Available data depends on the scopes you approve and the Strava MCP tools available to your account.

## Security notes

- Bring your own Strava API app credentials.
- Do not publish or share your Strava client secret.
- Tokens are stored locally on your machine.
- Token values, client secrets, and Authorization headers are redacted from normal CLI output.
- This package does not run a hosted token broker.
- This package does not include shared Strava credentials.
- This package forwards calls to Strava MCP; it does not add custom scraping or extra Strava API behavior.

## FAQ

### Do I need my own Strava API app?

Yes. Each user should provide their own Strava API app client ID and client secret.

### Should I share my client secret?

No. Treat it like a password.

### Does this publish my Strava data anywhere?

No. The bridge runs locally and forwards MCP requests from your MCP client to Strava MCP.

### Does this support writes?

The bridge forwards Strava MCP calls. Available behavior depends on Strava MCP tools and the scopes you approved.
