import { checkBackend } from './backend-check.mjs';

// Read-only diagnostic. Never emits provider data or exception details.
const result = await checkBackend(process.env);
for (const message of result.messages) console.log(message);
process.exitCode = result.code;
