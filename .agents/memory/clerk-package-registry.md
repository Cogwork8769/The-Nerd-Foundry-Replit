---
name: Clerk package registry versions
description: The workspace package firewall can lag behind the latest Clerk package versions.
---

When adding Clerk packages, prefer an explicitly available latest version if the registry rejects the scaffolded range.

**Why:** The workspace registry rejected an older scaffolded `@clerk/react` range even though a newer release was available, while the server-side Clerk packages installed normally.

**How to apply:** If a Clerk install reports `ERR_PNPM_NO_MATCHING_VERSION`, retry the same package at `@latest` before changing the integration approach.