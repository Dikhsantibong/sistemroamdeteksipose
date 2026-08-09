---
paths:
  - 'app/Services/**'
---

# Services

## Booth runtime config lives in settings table, defined in config/booth.php
Every runtime knob the tablet uses (recommendation count, voice/gesture/manual toggles, detection thresholds, intervals) is declared in `config/booth.php` under `settings` — type, group, default and validation rules — and its value is stored in the `settings` table.

Read and write it only through `App\Services\BoothSettings` (cached under `booth.settings`, call `flush()` after any direct write). `SettingUpdateRequest` derives its rules from the same definitions, so adding a setting means editing config/booth.php only — no controller, request or migration change.

Never hardcode these values in JavaScript: the admin must be able to change them without a developer.
