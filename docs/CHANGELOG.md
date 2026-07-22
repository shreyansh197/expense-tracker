# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- _Pending._

### Changed

- _Pending._

### Fixed

- _Pending._

### Removed

- _Pending._

### Performance

- _Pending._

### Accessibility

- _Pending._

### Security

- _Pending._

### Notes

- _Pending._

---

## [Sprint 10] - _TBD_

### Added

- _TBD_

### Changed

- _TBD_

### Fixed

- _TBD_

### Removed

- _TBD_

### Performance

- _TBD_

### Accessibility

- _TBD_

### Security

- _TBD_

### Notes

- _TBD_

---

## [Sprint 9] - _TBD_

### Added

- _TBD_

### Changed

- _TBD_

### Fixed

- _TBD_

### Removed

- _TBD_

### Performance

- _TBD_

### Accessibility

- _TBD_

### Security

- _TBD_

### Notes

- _TBD_

---

## [Sprint 8] - _TBD_

### Added

- _TBD_

### Changed

- _TBD_

### Fixed

- _TBD_

### Removed

- _TBD_

### Performance

- _TBD_

### Accessibility

- _TBD_

### Security

- _TBD_

### Notes

- _TBD_

---

## [Sprint 7] - _TBD_

### Added

- _TBD_

### Changed

- _TBD_

### Fixed

- _TBD_

### Removed

- _TBD_

### Performance

- _TBD_

### Accessibility

- _TBD_

### Security

- _TBD_

### Notes

- _TBD_

---

## [Sprint 6] - _TBD_

### Added

- _TBD_

### Changed

- _TBD_

### Fixed

- _TBD_

### Removed

- _TBD_

### Performance

- _TBD_

### Accessibility

- _TBD_

### Security

- _TBD_

### Notes

- _TBD_

---

## [Sprint 5] - _TBD_

### Added

- _TBD_

### Changed

- _TBD_

### Fixed

- _TBD_

### Removed

- _TBD_

### Performance

- _TBD_

### Accessibility

- _TBD_

### Security

- _TBD_

### Notes

- _TBD_

---

## [Sprint 4] - _TBD_

### Added

- _TBD_

### Changed

- _TBD_

### Fixed

- _TBD_

### Removed

- _TBD_

### Performance

- _TBD_

### Accessibility

- _TBD_

### Security

- _TBD_

### Notes

- _TBD_

---

## [Sprint 3] - _TBD_

### Added

- _TBD_

### Changed

- _TBD_

### Fixed

- _TBD_

### Removed

- _TBD_

### Performance

- _TBD_

### Accessibility

- _TBD_

### Security

- _TBD_

### Notes

- _TBD_

---

## [Sprint 2] - _TBD_

### Added

- _TBD_

### Changed

- _TBD_

### Fixed

- _TBD_

### Removed

- _TBD_

### Performance

- _TBD_

### Accessibility

- _TBD_

### Security

- _TBD_

### Notes

- _TBD_

---

## [Sprint 1] - _TBD_

### Added

- _TBD_

### Changed

- _TBD_

### Fixed

- _TBD_

### Removed

- _TBD_

### Performance

- _TBD_

### Accessibility

- _TBD_

### Security

- _TBD_

### Notes

- _TBD_

---

## [Sprint 0] - 2026-07-22 — Master Audit (documentation only)

### Added

- `sprint-reports/SPRINT_0_SUMMARY.md` — full Master Audit report per [prompts/MASTER_AUDIT.md](../prompts/MASTER_AUDIT.md): Executive Summary, Current State (source-verified), Critical Issues (CI-1..9), High Priority Improvements (HP-1..12), UI / UX / Accessibility / Performance / Backend / Security / Architecture audits, Technical Debt register, Retention audit, Competitive comparison, Priority Roadmap (14 milestones), Sprint recommendations, Risks, Category Scoring, Final Score 72/100.
- Verified `docs/IMPLEMENTATION_QUEUE.md` is present and complete: Sprint × Epic × Task decomposition for Sprints 1.1 → 14.3 with `Sprint`, `Epic`, `Task ID`, `Description`, `Business Value`, `Technical Value`, `Priority`, `Impact`, `Effort`, `Dependencies`, `Affected Files`, `Acceptance Criteria`, and `Status` (all default `Pending`).

### Changed

- Documented four drift items surfaced during the audit (recorded in SPRINT_0_SUMMARY §12):
  - DRIFT-1: `AI_CONTEXT.md §15` cites ~40 spec files; source shows 29 under `src/__tests__/`.
  - DRIFT-2: `ARCHITECTURE.md §11` does not list `challenges.ts`, `chronicle.ts`, `moneyDna.ts`, `supabase.ts` currently present in `src/lib/`.
  - DRIFT-3: `firestore.rules` still present at repo root though Firestore is disabled.
  - DRIFT-4: `CHANGELOG.md`, `RELEASE_NOTES.md`, `PRODUCTION_CHECKLIST.md`, `TESTING_CHECKLIST.md` remain scaffolds.
  - All four drifts assigned to Milestone M1 (Documentation Truth) for closure.

### Fixed

- _No application source code was modified in Sprint 0._

### Removed

- _None._

### Performance

- _No code changes. Performance recommendations recorded in SPRINT_0_SUMMARY §8 → routed to M6.2 and M9._

### Accessibility

- _No code changes. Accessibility gaps documented in SPRINT_0_SUMMARY §7 → routed to M4._

### Security

- _No code changes. Security findings (CI-3 `server-only`, CI-4 RLS CI smoke, CI-6 CSP tightening, plus HP-1 key rotation and HP-2 session anomaly) documented → routed to M5._

### Notes

- Sprint 0 is documentation-only per [prompts/MASTER_AUDIT.md](../prompts/MASTER_AUDIT.md) "IMPORTANT RULES". Only `sprint-reports/SPRINT_0_SUMMARY.md` and this CHANGELOG entry were written; no application source was modified.
- Roadmap of record: [docs/SPRINT_BOARD.md](SPRINT_BOARD.md) (14 milestones, 32 sprints, all Pending).
- Execution plan of record: [docs/IMPLEMENTATION_QUEUE.md](IMPLEMENTATION_QUEUE.md) (task-level, all Pending).

---

<!--
Section Guide (Keep a Changelog):
- Added        — new features
- Changed      — changes to existing functionality
- Fixed        — bug fixes
- Removed      — features removed in this release
- Performance  — performance improvements
- Accessibility — a11y improvements (WCAG, keyboard, screen reader, contrast)
- Security     — vulnerabilities addressed, hardening changes
- Notes        — context, migration guidance, known issues
-->
