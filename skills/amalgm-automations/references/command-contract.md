# Command contract

Use the field names below exactly. MCP receives the object directly. CLI
receives it through `--input '<json>'`, `--file <path>`, or `--stdin` and emits
one JSON envelope:

```json
{"result": {}}
```

Failures use stderr, a nonzero exit, and:

```json
{"error":{"code":"...","message":"...","status":400}}
```

Do not scrape prose or infer success from exit code alone; parse the envelope.
Unknown configuration fields are rejected. Arbitrary JSON inside workflow
action input and Run Now input remains valid payload data.

## create

```json
{
  "id": "optional-readable-id",
  "targetId": "optional-explicit-target",
  "name": "Optional name",
  "description": "Optional description",
  "enabled": true,
  "schedules": [{
    "id": "optional-trigger-id",
    "cron": "0 9 * * 1-5",
    "timezone": "America/Los_Angeles",
    "enabled": true,
    "maxOccurrences": 10
  }],
  "webhooks": [{
    "id": "optional-trigger-id",
    "source": "github",
    "event": "push",
    "secret": "optional-provider-secret-at-least-16-characters",
    "enabled": true
  }],
  "workflow": {
    "id": "optional-workflow-id",
    "name": "Optional workflow name",
    "script": "Human-readable summary of what the workflow does.",
    "compiled": {
      "version": 1,
      "steps": [{
        "id": "notify",
        "actionId": "channels.notify_user",
        "input": {"title":"Reminder","message":"Call Mom"}
      }]
    },
    "allowlist": null,
    "limits": null
  }
}
```

At least one executable step is required when `compiled` is supplied. Omit
`targetId` when Shell has bound the principal to one machine. The returned
webhook URL is the provider destination; a configured signing secret is
write-only on later reads.

Omit `id` for a new automation. An explicit id names a persistent logical
identity: deleting and recreating it retains that identity's run history and
Run Now idempotency keys. Use a new key for each new logical run and reuse it
only when retrying that run.

CLI example:

```bash
printf '%s\n' '{"name":"Weekday check","schedules":[{"cron":"0 9 * * 1-5","timezone":"America/Los_Angeles"}],"workflow":{"script":"Run the weekday check.","compiled":{"version":2,"steps":[{"id":"check","kind":"command","command":"my-check","cwd":"/absolute/project"}]}}}' \
  | amalgm automations create --stdin
```

## list

All fields are optional:

```json
{"targetId":"machine-id","enabled":true,"limit":20,"offset":0}
```

Use it to find candidates, then `get` the exact definition before mutation.

## get

```json
{
  "automation_id": "automation-id",
  "include_runs": true,
  "run_query": {"status":"completed","limit":20,"offset":0}
}
```

`include_runs` and `run_query` are optional. `run_query.status` is one of
`pending`, `sent`, `running`, `completed`, or `failed`.

## update

Updates are grouped so one call can change metadata and owned resources:

```json
{
  "automation_id": "automation-id",
  "patch": {
    "targetId": "optional-new-target",
    "name": "New name or null",
    "description": "New description or null",
    "enabled": true
  },
  "schedules": {
    "create": [{"cron":"0 9 * * *","timezone":"UTC"}],
    "update": [{"id":"schedule-id","patch":{"enabled":false}}],
    "delete": ["old-schedule-id"]
  },
  "webhooks": {
    "create": [{"source":"github","event":"push"}],
    "update": [{"id":"webhook-id","patch":{"rotateUrl":true}}],
    "delete": ["old-webhook-id"]
  },
  "workflow": {
    "update": {
      "name": "Updated workflow name",
      "script": "Updated summary",
      "compiled": {
        "version": 2,
        "steps": [{
          "id": "check",
          "kind": "command",
          "command": "my-check",
          "cwd": "/absolute/project"
        }]
      },
      "allowlist": null,
      "limits": null
    }
  }
}
```

Every included patch must contain a real change. Workflow change is exactly one
of `{ "create": ... }`, `{ "update": ... }`, or `{ "delete": true }`.
Schedule and webhook changes may combine create/update/delete arrays. Preserve
resource ids returned by `get`; ids are scoped to their automation.

## delete

```json
{"automation_id":"automation-id"}
```

This deletes current configuration, triggers, and workflow. It does not delete
historical runs.

## run-now

```json
{
  "automation_id": "automation-id",
  "input": {"requestedBy":"user"},
  "idempotency_key": "stable-key-for-this-logical-request"
}
```

`input` may be any JSON value. Admission requires an enabled automation with an
executable compiled workflow. The returned run starts as `pending`; follow it
with `get` until terminal. Reusing the same key for the same logical request
returns the same run rather than creating a duplicate.

## Webhook completion

Creating an Amalgm webhook trigger does not register it at GitHub or another
provider. Configure the returned URL in that provider separately, use JSON
content type, select only the requested events, and use the same optional
signing secret on both sides. Rotating the URL invalidates the old bearer
capability.
