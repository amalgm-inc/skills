# Amalgm

Agent skills for working with [Amalgm](https://amalgm.ai).

```bash
npx skills add amalgm-inc/skills
```

Choose your agent when prompted. Requires Node.js 22.20 or newer. The installer
supports Codex, Claude Code, Cursor, and other compatible agents.

## Available skills

| Skill | What it does |
| --- | --- |
| [Amalgm Automations](skills/amalgm-automations/SKILL.md) | Connect your account, schedule workflows, run native agents and scripts, and inspect results. |

Installing the skill gives your agent the instructions to set up and use Amalgm.
It will guide you through Google sign-in and connecting your computer when needed.

## Updates

```bash
npx skills update
```

Updates are installed when you run this command. They update the instructions;
the Amalgm runtime uses its own update path.

## Maintaining the collection

Skills are synced from their owning product repositories. Edit the source,
commit it, then refresh the public copy from that checkout:

```bash
node scripts/sync-skill.mjs amalgm-automations ../amalgm-automations HEAD
```

Review the complete diff and recorded commit in `sources.json` before publishing.
The command reads committed files only. See [PURPOSE.md](PURPOSE.md) for ownership
and distribution rules.
