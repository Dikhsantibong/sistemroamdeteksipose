---
paths:
  - config/booth.php
---

# Config

## Booth settings cache keys off the definition list
`BoothSettings::all()` is cached with `rememberForever`, so a new key added to `config/booth.php` used to be invisible until someone cleared the cache by hand — the tablet received `undefined` for it.

The cache key now embeds a fingerprint of the definition key list (`BoothSettings::cacheKey()`), so adding or removing a setting invalidates it automatically. Do not replace that with a fixed key.

Changing a `default` still does NOT update rows already written by `SettingSeeder` (it uses `firstOrCreate`). Adjust those from /admin/settings.
