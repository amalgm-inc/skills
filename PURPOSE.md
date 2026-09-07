# Amalgm skills

## Purpose

This is Amalgm's public collection of agent skills. It lets people install
focused guidance for released Amalgm tools with one standard command, without
access to private product repositories. Product repositories own the guidance;
this repository distributes reviewed copies and lets users update them with
the standard skills CLI.

## Axioms

1. Every skill has one canonical source repository and one recorded source commit.
2. A distributed skill is an exact copy of its source, including its references.
3. Only the selected skill directory is copied; product code and credentials are never distribution inputs.
4. The public brand is Amalgm; individual skills name the capability they provide.
5. Installing or updating guidance does not install, authenticate, or update the Amalgm runtime.

## Tree

- `skills/` contains the installable, synced skills.
- `sources.json` records their canonical repositories, paths, and copied commits.
- `scripts/` contains the maintainer command that refreshes a skill from its source.

Change instructions in the owning product repository, then sync and review the
public diff. Do not hand-edit a synced copy.
