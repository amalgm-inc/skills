# Workflow plans

The compiled plan is an immutable, ordered snapshot when a run is admitted.
Step ids must be unique and the plan must contain 1–100 steps.

## Step forms

Version 1 accepts action steps only:

```json
{
  "version": 1,
  "steps": [{
    "id": "notify",
    "actionId": "channels.notify_user",
    "input": {"title":"Reminder","message":"Call Mom"}
  }]
}
```

Version 2 accepts any ordered mix of these three forms:

```text
Amalgm action
{ id, actionId, input }

Native command
{ id, kind:"command", command, args?, cwd?, env?, stdin?,
  timeoutMs?, maxOutputBytes? }

Code script
{ id, kind:"script", runtime:"shell"|"node"|"python", source,
  args?, cwd?, env?, stdin?, timeoutMs?, maxOutputBytes? }
```

`id`, `actionId`, `command`, every `args` element, environment keys and values,
and `runtime` are strings. `timeoutMs` and `maxOutputBytes` are positive
integers. `cwd` is optional but must be absolute when present.

## Amalgm actions and agents

Action steps run through the selected machine's installed Amalgm Tools/action
catalog. Discover an action before using it. Do not derive action ids from MCP
tool names.

The Amalgm-agent action is distinct from a native CLI agent:

```json
{
  "id": "review-with-amalgm-agent",
  "actionId": "chat.chat_agent_run",
  "input": {
    "agent_installation_id": "configured-installation-id",
    "message": "Review this occurrence.",
    "context": {"$runInput":true}
  }
}
```

The installation must exist and declare a usable model/provider binding. Do
not guess an installation id from an adapter name such as `codex`.

## Native CLI agents

Use a command step for the user's independently installed CLI:

```json
{
  "id": "native-codex-review",
  "kind": "command",
  "command": "codex",
  "args": ["exec", "Review this repository and write REVIEW.md"],
  "cwd": "/Users/me/src/project",
  "timeoutMs": 1800000,
  "maxOutputBytes": 1048576
}
```

The executable is resolved from the target machine's PATH and uses its own
user-level login. Args are passed directly with `shell:false`; `$HOME`, pipes,
redirection, globbing, and quoting syntax are literal arguments. If shell
syntax is intended, choose the script lane explicitly.

Equivalent installed programs such as `claude -p ...` or `opencode ...` use
the same command form. Their accepted args and authentication belong to those
programs, not Automations.

## Scripts

Scripts persist source in the workflow and execute through a temporary file on
the selected machine. The temporary file is removed after execution.

```json
{
  "id": "process-event",
  "kind": "script",
  "runtime": "node",
  "source": "let s=''; process.stdin.on('data', c => s += c).on('end', () => console.log(JSON.parse(s)));",
  "cwd": "/absolute/project",
  "stdin": {"$runInput":true},
  "env": {"MODE":"automation"},
  "timeoutMs": 30000,
  "maxOutputBytes": 262144
}
```

Use `runtime:"shell"` for POSIX shell semantics on Unix and PowerShell file
execution on Windows. Use `node` or `python` for explicit code in those
runtimes. Account for target-machine portability when selecting a runtime or
absolute path.

## Run input

The exact singleton object below is the only template marker:

```json
{"$runInput":true}
```

It resolves recursively inside action `input`. In process steps it may be used
as `stdin`; strings are passed verbatim and other JSON values are serialized
with a trailing newline. Trigger payloads are never ambient.

## Execution and retries

Each step is recorded as running before its effect and committed as completed
before the next step begins. Completed steps are skipped after reconnect.

Every run-step pair receives the stable key `<run-id>:<step-id>`. Process steps
receive it as `AMALGM_AUTOMATION_IDEMPOTENCY_KEY`. Shell's private runtime,
tunnel, device, and machine credentials are stripped from child environments.

An uncertain machine crash can repeat the current effect. Amalgm actions can
deduplicate the step key; an arbitrary command or script is at-least-once and
must durably deduplicate that environment value when exactly-once effects are
required.

Process output records exit code, signal, stdout, stderr, and whether capture
was truncated. Timeouts, cancellation, and output bounds are enforced on the
machine. The durable journal compacts oversized results rather than allowing
large output to strand the run update.

## Common boundary diagnoses

- `process_execution_unavailable`: selected machine host lacks process support.
- Spawn/not-found error: executable or runtime is absent from that machine PATH.
- Nonzero exit: inspect bounded stdout/stderr; the automation correctly failed.
- Timeout: adjust only when the intended command legitimately needs longer.
- `Installed agent has no model`: select or configure an actual Amalgm agent
  installation with a model; this is not a native CLI-auth failure.
- Action-specific HTTP/authorization error: verify that action's owning service
  and input contract without changing Run Now semantics.
