#!/usr/bin/env node
import { runCli } from './cli.js';
import { runStdioBridge } from './bridge.js';
import { redactString } from './redaction.js';
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0)
        await runStdioBridge();
    else
        await runCli(args);
}
main().catch((error) => {
    console.error(redactString(error.message));
    process.exitCode = 1;
});
//# sourceMappingURL=index.js.map