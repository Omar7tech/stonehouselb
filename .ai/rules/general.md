---
paths:
  - '**'
---

# General

## Production deploy is only git pull, build, migrate, optimize
Production is updated over SSH with only: `git pull`, `npm run build`, `php artisan migrate`, `php artisan optimize`. Every change must ship fully through those four steps.
Do not make changes that need manual work on the server: no hand-edited files, no manual DB edits or one-off tinker/SQL, no required seeder runs, no new .env keys without a safe default, no new composer/npm dependencies or extra artisan commands (storage:link, queue restarts, etc.) without flagging it first.
Data changes go in migrations. If a change cannot fit this flow, stop and tell the user before implementing.
