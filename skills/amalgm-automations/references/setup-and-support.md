# Setup and support

Read this when installing, signing in, repairing a connection, or helping with
an error. Use Shell's commands for setup and Automations reads to verify access.
The agent handles the commands; the person chooses their Google account and
approves connecting their computer in the browser.

## Install this skill

The public download includes this skill and all its references; it needs no
GitHub account or access to Amalgm's source repositories. With Node.js 22.20+
(or Amalgm's supplied Node runtime), run:

```bash
npx skills add amalgm-inc/skills
```

Choose the intended agent in the installer's prompt. Use `npx skills update`
to refresh installed instructions. Installing the skill supplies guidance;
use the connection steps below to access Automations.

## Start with the connection you have

If Automations MCP already answers `list` with `{"limit":1}`, continue the task.
Do not require a local CLI for a working remote MCP connection. If that remote
connection requires authorization, use its actual sign-in/reconnect link. A
cloud agent cannot repair the user's computer by installing Shell on its own
temporary machine.

For local CLI work, use the existing `amalgm` executable or the exact Shell
launcher supplied by Amalgm's installer/app. The examples below use `amalgm`
as shorthand for that executable. Keep the same installation and account
throughout setup and verification.

```bash
amalgm --version
amalgm --help
amalgm automations --help
amalgm automations list --input '{"limit":1}'
```

When the user has chosen an account, add `--user` with that actual email to
Shell commands, including `amalgm automations ...`. An email selects a local
account; it does not authenticate it. `targetId` selects an execution computer,
not an account. Never substitute one for the other.

A successful Automations response is a JSON `result` envelope; an empty list
is valid. The six Automations commands use that envelope. Shell's `status`
returns a different JSON shape; `login` and `run` report progress as text.

CLI and skill are the first public launch surfaces; local stdio MCP setup is
a follow-up. Use the CLI for new local setup. Reuse an already working MCP
connection without configuring a second connection or copying credentials.

## Install only when needed

Check for an existing app-managed installation before adding another copy.
If the desktop app already manages this computer, use its setup/connection
flow. A missing PATH entry is not proof that Amalgm is uninstalled.

On a fresh computer with Node.js and npm, the Shell package supplies the
global command. Check the published package's requirements before installing:

```bash
node --version
npm view @amalgm/shell version engines --json
npm install --global @amalgm/shell
amalgm --version
amalgm automations --help
```

Do not install `@amalgm/automations` alone as a substitute for Shell: its direct
CLI/MCP executables do not perform the user's Shell login. Do not change an
existing app's exact runtime binding or install a second runner to fix a
version mismatch. If the installed Shell lacks `automations`, report that
version and use its supported update path; do not invent `amalgm update`.

If Node/npm is unavailable or global installation is denied, use
[Amalgm computer setup](https://amalgm.ai/setup). The person signs in with
Google and the page supplies the current platform-specific install command.
That installer includes a private Node runtime and a one-time setup code.
Execute the command supplied by the trusted setup page when the user has
authorized connecting this computer. Do not invent a code, run a code-less
`install.sh`, or use sudo as an automatic workaround. Keep the code private
to this setup session.

If `amalgm` is absent from PATH after the web installer runs, use the exact
launcher identified by the installer or app. Do not pick a runtime by sorting
version folders.

## Sign in and connect the computer

For a first login through the CLI:

```bash
amalgm login --no-open
```

Run it in a persistent terminal/process session. Show the **verification URL
printed by that process** to the user as a clickable link; do not construct
the URL yourself. Omit `--no-open` only when the command should open the browser
on the same computer. The approval link and setup code are short-lived setup
information, not material for logs or support emails.

Tell the person: “Continue with Google, choose your Amalgm account, and approve
connecting this computer. I'll check the connection and continue afterward.”
Show the computer name when known. The browser owns sign-in and consent; do
not ask for passwords, provider tokens, or a credit card. Existing accounts
can use their existing supported sign-in method rather than creating a second
account just to use Google.

Keep that process alive while the person approves. Follow its progress until
`AMALGM_READY` appears or it reports an error. `login` continues hosting the
runtime after readiness; it is not expected to exit successfully. Do not kill
it after approval or use `--exit-after-ready` for real setup.

An already approved, unexpired code can be passed to
`amalgm login --setup-code CODE` if the original waiting process ended. Use
only the actual code from this setup attempt. If approval expired, finish the
old attempt and start a fresh login. If the person cancels, stop that attempt;
do not reopen approval until they choose to continue.

## Reuse or resume a registered computer

Use the account email selected during setup. If it is unknown, ask the user
which account they connected; do not read credential files to discover it.
If the installed `amalgm --help` advertises `status --all`, that command can
list public registration metadata. Multiple accounts require an explicit
choice. Replace the example email below with the user's selected account:

```bash
amalgm status --user person@example.com
```

| Observed state | Next action |
| --- | --- |
| `registration: "ready"`, `running: true` | Reuse this runtime; verify Automations access. |
| `registration: "ready"`, `running: false` | Run `amalgm run --user person@example.com` in a persistent session, then verify. |
| `registration: "absent"` or `"incomplete"` | Complete the supported login/setup flow for this account; preserve existing registration files. |
| Shell requests `--user` or lists several accounts | Ask which account to use if it is not already established. Supply that email consistently. |
| Status fails | Diagnose the actual error; a failed read is not proof that registration is absent. |

After login or resume, require both ready/running status and a successful read:

```bash
amalgm automations list --user person@example.com --input '{"limit":1}'
```

Then return to the user's original automation request. This proves connection
and access, not that a future workflow ran or that every executable is installed.
MCP results can independently prove hosted access, but do not prove the selected
execution computer is online.

Use an existing app/installer-managed background runtime when possible. A
foreground `login`/`run` process must remain alive for local execution; do not
promise it survives terminal closure, logout, or reboot without evidence. If
the agent's process sessions cannot persist, use the app/setup-managed path or
explain the remaining requirement. An offline target leaves admitted runs
pending; it does not erase their history.

## Diagnose the failing boundary

Read the error's code, message, and status together. Keep automation and run
ids when available. Try the
appropriate repair and verify again. If the same failure persists with no new
evidence, explain it and offer support rather than looping through login,
reinstallation, or repeated writes.

| Failure | What to do |
| --- | --- |
| `user_not_registered` or `user_selection_required` | Select the intended account email, inspect its status, and complete login if needed. Use `status --all` only when the installed CLI advertises it. |
| `runtime_unavailable`, connection refused, or Shell says it is not running | Inspect the selected account's status and use the resume/setup decision above. A standalone adapter asking for environment credentials should be replaced by the global `amalgm automations` path. |
| `runtime_unauthorized` | Retry the read once through the public Shell command, which obtains the current local connection. If it still fails, keep the error for support; never extract or replace tokens manually. |
| `runtime_transport` or `runtime_protocol` | Check local readiness, connectivity, and the installed version. A timeout or service outage is not evidence that the user needs a new account. |
| Wrong account, `forbidden`, or a target authorization error | Verify the chosen account and computer. Do not change ownership, guess another target, or treat every 403 as an expired login. |
| Missing/corrupt device key or an explicit recovery-required error | Explain key recovery and use `amalgm auth recover --user person@example.com` only when the user chooses recovery. It requires its own browser approval. Never delete identity files or silently re-register. After recovery, inspect status and resume if needed. |
| HTTP 429 or a reported rate limit | Honor a supplied retry delay/reset time and reduce request frequency. Limits are per minute/hour; do not invent numeric allowances or a reset time. If no delay is supplied, back off conservatively with a bounded retry, then report the unresolved limit. Never switch accounts to bypass it. |
| An installed native agent needs login, or its model/provider rejects work | Use that program/service's own supported login. Amalgm Google sign-in does not sign into Codex, Claude, or other providers. Do not add Amalgm credits as a guessed fix. |
| Missing executable, failed step, or invalid workflow | Read [workflow diagnoses](workflow-plans.md#common-boundary-diagnoses); repair the actual step/configuration without replacing the automation to hide the failure. |

For a failed mutation, inspect existing state before retrying. Reuse the same
Run Now input and idempotency key after an uncertain response. Preserve a
returned disabled draft id: get that definition, then repair it with `update`
instead of retrying `create`. Invalid supplied configuration is rejected
before any write; a later service failure can still leave a disabled draft.
A retry must not turn one requested automation or run into several.

## Get support

Support is **Aayush, aayush@amalgm.ai**:
[Email Aayush](mailto:aayush@amalgm.ai?subject=Amalgm%20Automations%20help).
Offer this as soon as the user asks, or when the supported repair does not
resolve their problem. They do not need to complete a troubleshooting checklist
to contact a person.

Prepare a short email when helpful:

```text
To: aayush@amalgm.ai
Subject: Amalgm Automations — <short problem>

I was trying to: <intended result>
What happened: <failure and approximate time, including timezone>
Setup: <OS, agent/client, and Amalgm version if available>
Error: <code/status and a short redacted message>
Automation/run: <ids or viewing links, if available>
Already tried: <relevant checks or repair>
```

Use only relevant evidence. Do not attach raw runtime logs, browser cookies,
private auth files, setup links/codes, webhook URLs/signing secrets, or the
user's code, prompts, file paths, and workflow output without reviewing and
redacting them. Status output can contain private local paths; summarize its
registration/running fields instead of copying the entire object.

Send through an available email tool only if the user has explicitly authorized
the email; otherwise provide the draft and mail link. Do not invent a support
ticket, response-time promise, or claim that an email was sent.
