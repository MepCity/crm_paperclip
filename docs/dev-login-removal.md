# Temporary development login removal

Tracking: MEP-963. Remove at project completion and before any real deployment.

- Remove the local admin seed and its invocation in `scripts/dev.ts`.
- Remove the development username mapping, form flag and login hint.
- Remove the seeded account and its organization from any database being deployed.
- Retain the production credential regression tests and the 10-character sign-up minimum.
- Update the README first-run instructions to normal sign-up and organization setup.
