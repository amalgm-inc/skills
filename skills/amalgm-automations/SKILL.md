---
name: amalgm-automations
description: Set up and use Amalgm to schedule workflows, run native agents and scripts, receive webhooks, and inspect automation results through the amalgm CLI or an existing MCP connection.
---

# Amalgm Automations

Use this skill to turn a user's requested recurring, event-driven, or manual
workflow into one durable Amalgm automation and verify what actually ran.
Automations owns configuration and permanent run history; the selected Amalgm
machine executes the workflow.

Amalgm Automations is free during launch. Guide the person through Google sign-in and computer
approval when needed; do not introduce a payment step. A native agent or other
external service still uses its own account and may have its own usage costs.

## Choose the available adapter

Use the global `amalgm automations` CLI in a native local agent. If an existing
MCP connection already exposes the six `amalgm_automations_*` tools, reuse it.

```text
MCP                                 CLI
amalgm_automations_create           amalgm automations create
amalgm_automations_list             amalgm automations list
amalgm_automations_get              amalgm automations get
amalgm_automations_update           amalgm automations update
amalgm_automations_delete           amalgm automations delete
amalgm_automations_run_now          amalgm automations run-now
```

Both adapters accept the same JSON object and call the same SDK command
surface. Do not translate one into a different resource-level API.

Reuse a working connection. For an available MCP connection, a small `list`
request with `{"limit":1}` proves access; do not install or log in again. For
CLI use, check `amalgm automations --help` and use
`amalgm automations list --input '{"limit":1}'`. An empty successful list is
ready, not a setup failure. Respect an explicitly selected account.

If the user asks to install or sign in, or that read fails, read
[setup and support](references/setup-and-support.md). It covers the supported
install, browser approval, account selection, runtime restart, and recovery
commands. Carry setup through to a successful Automations read, then resume
the original request. Do not stop at “Shell must be running.”

Shell owns authentication. Never read, copy, or ask the user to supply a runtime
token, DPoP proof, device key, or machine credential. The public connection
commands obtain what they need; environment-variable credential setup is not
the user login flow.

Read [references/command-contract.md](references/command-contract.md) whenever
composing `create` or `update`, or when exact fields are uncertain. Read
[references/workflow-plans.md](references/workflow-plans.md) whenever a
workflow runs an Amalgm action, native executable, code script, or trigger
input.

## Preserve scope and intent

- List or get before changing an existing automation. Identify the exact
  automation and preserve fields the user did not ask to change.
- The CLI is global. Its invocation directory never scopes the automation.
  Execution belongs to the selected target machine.
- Omit `targetId` in a machine-bound session. Never guess or copy an opaque
  target id. If the principal has multiple targets, let the service require an
  explicit user choice.
- A process `cwd`, when supplied, must be absolute. If omitted, the step runs
  in that user's Workspaces folder on the selected machine.
- Workflow `env` is persisted ordinary configuration, not a secret store.
  Never place Shell credentials or reusable service secrets in it.
- Use `--stdin` for CLI payloads containing a webhook signing secret or
  complex source. Do not expose those values in command arguments or logs.
- Delete only after the exact id is established and deletion is within the
  user's request. Deleting configuration intentionally retains run history.
  Omit `id` when creating a new automation; explicitly reusing a deleted id
  refers to the same logical identity and retains its history and retry keys.

## Build one complete definition

Create the automation, its schedule/webhook triggers, and its optional workflow
in one task-level call. Invalid supplied configuration fails before any write.
The service stages valid multi-resource changes and enables the definition
only after setup succeeds. If a later service failure returns a disabled draft
id, get and repair that draft with `update`; do not create a replacement.

Use a finite `maxOccurrences` when the user's request is bounded. Do not turn
"ten times" into an unbounded schedule plus a future cleanup promise.
Use standard five-field cron; the finest interval is one minute. Seconds and
cron macros are rejected. Account limits are 10 configuration API writes and
10 new runs per minute, shared by every client and trigger, with at most 100
unfinished runs. One complete create with a schedule and workflow uses four
writes. On HTTP 429, wait for `Retry-After` (or 60 seconds if unavailable), then
repair an identified draft or retry the same delivery key; never create a new
definition or key to evade the limit. Accepted runs remain durable.

Choose workflow lanes explicitly:

- An Amalgm tool or Amalgm agent is an action step. `chat.chat_agent_run` is
  the Amalgm-agent path and requires a configured agent installation.
- A user's native Codex, Claude Code, OpenCode, or other installed program is
  a command step. Arguments are literal argv; no shell is implied.
- Inline shell, Node.js, or Python source is a script step. Choose this lane
  only when code or shell semantics are intentional.

Version 1 is action-only. Use version 2 for command or script steps and when
mixing lanes. Discover Amalgm action ids through the Tools product and native
executables through the selected machine; never guess either.

## Verify Run Now to completion

`run-now` performs durable manual admission. Its initial `pending` result is
not evidence that work completed.

1. Supply a stable, caller-chosen `idempotency_key` whenever the request might
   be retried. Use a new key for each new logical run.
2. If admission is retried, send the same automation id, input, and key. The
   returned run id must remain the same.
3. Poll `get` with `include_runs: true` or a `run_query` until the admitted run
   becomes `completed` or `failed`. Match the exact run id; do not assume the
   newest unrelated run is yours. Space out reads and back off while state is
   unchanged; a rate-limit response is a reason to wait, not to submit again.
4. Inspect every step's status and bounded output. Report failure honestly,
   including the failing step and service error.

`pending` means durable and awaiting its machine. `sent` or `running` means the
machine holds a lease. Only `completed` and `failed` are terminal.

Keep the user informed while waiting. If the machine stays unavailable or the
current session cannot keep waiting, report the exact run id and observed
nonterminal state; do not claim completion, create a replacement, or promise
background monitoring that has not been set up.

Diagnose at the failing boundary. Examples: `process_execution_unavailable`
means that machine lacks the process host; an executable-not-found error is a
machine PATH/install problem; `Installed agent has no model` is agent
configuration; an action-specific HTTP error belongs to that action service.
Do not relabel these as Run Now failures or patch the automation around them.

## Help when something goes wrong

Use [setup and support](references/setup-and-support.md) for login/runtime
failures, HTTP 429 or reported rate limits, and contacting support. Preserve
the actual error code, distinguish the failing service, and use bounded retries.
Do not invent minute/hour allowances or reset times that the service has not
reported.

For an unresolved issue, offer **Email Aayush at aayush@amalgm.ai** and prepare
a concise, redacted draft when helpful. Send only with the user's explicit
authorization and an available email tool; otherwise give them the draft.

## Report the outcome

Return the automation id, target choice if the user selected one, trigger
summary, workflow lanes, and—when execution was requested—the exact run id and
terminal result. Mention that run history is durable. Never claim a schedule
fired merely because configuration creation succeeded.
Include automation/run links when returned by the product; do not invent a
deep link or use a private webhook URL as a viewing link.
