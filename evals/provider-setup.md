# Provider Setup

Use a local ignored `.env.local` file for long-running provider evals. Do not
commit this file.

## Recommended Local File

Create this file at the repository root:

```text
.env.local
```

Use this shape:

```dotenv
STEPFUN_API_KEY=replace-with-stepfun-key
STEPFUN_BASE_URL=https://api.stepfun.com/v1
TOKENDANCE_API_KEY=replace-with-tokendance-key
TOKENDANCE_BASE_URL=https://tokendance.space/gateway/v1
```

The scripts read `.env.local` automatically when it exists. Existing process
environment variables win; `.env.local` only fills missing values.
`STEPFUN_BASE_URL` is optional because the scripts default to the official normal
Chat Completions base URL.

## Why Not `set` or `$env` Only

`set` in `cmd.exe` lasts only for the current cmd window.

```cmd
set "STEPFUN_API_KEY=..."
```

`$env:` is PowerShell syntax and does not work in `cmd.exe`.

```powershell
$env:STEPFUN_API_KEY="..."
```

For repeatable evals, `.env.local` is simpler than retyping values for each new
terminal.

## First Smoke Commands

```cmd
npm run provider:smoke -- --execute --provider stepfun --model step-3.5-flash
```

```cmd
npm run provider:smoke -- --execute --provider tokendance --model deepseek-v3.2
```

If TokenDance uses a different model id, update the `--model` value after
checking the provider's model list.

## Safety

- `.env.local` is ignored by git.
- Provider scripts print whether an env file loaded, but never print key values.
- Provider smoke is compatibility evidence only, not token-saving proof.
- If a key has been pasted into chat or logs, rotate it in the provider dashboard
  after testing.
