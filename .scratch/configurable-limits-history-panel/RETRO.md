# Retro: configurable limits + history + Jira panel (25 Nov 2026)

Session: spec/tickets 00:40, implementation tickets 01-04 ~01:00, ticket 05
deploy + verify + Devpost publish ~02:21 WIB. Production v3.0.0 live and
verified; Devpost updated, still SUBMITTED 5/5.

## 1. Automated checks: manifest validity was unverified until deploy time

Two manifest errors surfaced only at deploy, after the user had supplied
the token: module keys must be unique across ALL module types (a function
key equal to an action key fails lint), and function keys are capped at
23 characters. Both are local and deterministic. Neither the implementer
nor the code-review step ran `forge lint`, because it needs login and no
login was available during implementation.

Actions, in order:
- Test whether `forge lint` runs without credentials for local checks.
  If yes, wire it into the repo's check path (npm script + CI).
- The repo has no CI at all. A CI job running `npm test` plus lint is
  the standing guardrail this session lacked.
- Until the check exists, review must cover manifest keys (unique across
  module types, at most 23 chars). Prefer the automated check over the
  review rule.

## 2. Deploy reliability: hanging Forge commands are network flakes

Two deploy attempts failed with a TLS disconnect after hanging about
10 minutes (one dev redeploy, one production). Each burned a user
approval card that then timed out. Both retries succeeded in about
2 minutes. A Forge command hanging past ~5 minutes is a flake: retry
promptly instead of waiting it out. Run deploys only while the user is
present, so the approval card does not expire mid-deploy.

## 3. Placeholder trap: numeric placeholders that mimic values

The panel's placeholders "20"/"30" looked like real values, so the
first "Check spend" click failed HTML5 validation ("Please fill out
this field"). Caught only by live browser verification. Fixed by
pre-filling real demo values. Standard: never use a numeric placeholder
that could be mistaken for a value; pre-fill the demo case or use a
descriptive hint.

## What worked

- Dev-first deploy plus live browser verification caught the placeholder
  bug before production.
- The empty-history proof cleanly disambiguated the production install
  from DEV (both Rovo agents share one display name).
- Spec + tickets kept the build organized; the one-token, never-stored
  auth flow worked.
