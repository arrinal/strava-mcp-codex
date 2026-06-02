import { Command } from 'commander';
import { VERSION } from './constants.js';
import { configPaths, loadConfig, redactedConfig, saveConfigPatch } from './config.js';
import { login, loadAuth, saveAuth } from './auth.js';
import { codexStatus, installCodexConfig, uninstallCodexConfig, type CodexInstallMode } from './codex.js';
import { runHealthCheck, listTools } from './health.js';
import { redactObject } from './redaction.js';

function printJson(value: unknown): void {
  console.log(JSON.stringify(redactObject(value), null, 2));
}

export async function runCli(argv: string[]): Promise<void> {
  const program = new Command();
  program.name('strava-mcp-codex').description('Local stdio bridge for Strava MCP and Codex.').version(VERSION);

  program.command('login')
    .option('--no-open-browser', 'print authorize URL instead of opening browser')
    .action(async (opts) => {
      const auth = await login({ noOpenBrowser: opts.openBrowser === false });
      printJson({ ok: true, auth });
    });

  program.command('logout').action(async () => {
    const config = await loadConfig();
    await saveAuth(config.authPath, {});
    printJson({ ok: true, authPath: config.authPath });
  });

  const config = program.command('config');
  config.command('show').action(async () => printJson(redactedConfig(await loadConfig())));
  config.command('paths').action(() => printJson(configPaths()));
  config.command('set-client')
    .requiredOption('--client-id <id>')
    .requiredOption('--client-secret <secret>')
    .action(async (opts) => {
      const next = await saveConfigPatch({ clientId: opts.clientId, clientSecret: opts.clientSecret });
      printJson({ ok: true, config: redactedConfig(next) });
    });

  const auth = program.command('auth');
  auth.command('status').action(async () => {
    const cfg = await loadConfig();
    const state = await loadAuth(cfg.authPath);
    printJson({ authPath: cfg.authPath, hasAccessToken: Boolean(state.access_token), hasRefreshToken: Boolean(state.refresh_token), expiresAt: state.expires_at });
  });

  const codex = program.command('codex');
  codex.command('install')
    .option('--dry-run', 'print patched config without writing')
    .option('--mode <mode>', 'global or npx', 'global')
    .action(async (opts) => {
      const mode = opts.mode === 'npx' ? 'npx' : 'global';
      const result = await installCodexConfig({ dryRun: Boolean(opts.dryRun), mode: mode as CodexInstallMode });
      if (opts.dryRun) printJson({ ok: true, dryRun: true, configPath: result.configPath, changed: result.changed, server: mode === 'npx' ? { command: 'npx', args: ['-y', 'strava-mcp-codex'] } : { command: 'strava-mcp-codex' } });
      else printJson({ ok: true, configPath: result.configPath, changed: result.changed });
    });
  codex.command('status').action(async () => printJson(await codexStatus()));
  codex.command('uninstall')
    .option('--dry-run')
    .action(async (opts) => {
      const result = await uninstallCodexConfig({ dryRun: Boolean(opts.dryRun) });
      if (opts.dryRun) printJson({ ok: true, dryRun: true, configPath: result.configPath, changed: result.changed, action: 'remove mcp_servers.strava' });
      else printJson({ ok: true, configPath: result.configPath, changed: result.changed });
    });

  program.command('health').action(async () => printJson(await runHealthCheck()));
  program.command('doctor').action(async () => printJson(await runHealthCheck()));
  program.command('tools').action(async () => printJson(await listTools()));
  program.command('setup').description('Run minimal guided setup hints.').action(() => {
    console.log('Run: strava-mcp-codex config set-client --client-id <id> --client-secret <secret>');
    console.log('Then: strava-mcp-codex login');
    console.log('Then: strava-mcp-codex codex install');
  });

  await program.parseAsync(argv, { from: 'user' });
}
