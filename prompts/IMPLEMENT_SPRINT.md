# ExpenStream ADK — Sprint Implementation Workflow

## Purpose

This document defines the standard implementation workflow for every development sprint.

Always read and follow:

- prompts/STANDARD_HEADER.md

before executing this workflow.

The documentation inside the `docs/` directory is the project's single source of truth.

Do not make assumptions.

---

# Sprint Execution Workflow

## Phase 1 — Understand the Sprint

Before making any code changes:

1. Read `docs/IMPLEMENTATION_QUEUE.md`.
2. Locate the requested Sprint.
3. Read every task belonging to that Sprint.
4. Understand:
   - Sprint Goal
   - Business Value
   - Technical Value
   - Dependencies
   - Acceptance Criteria
   - Affected Files
5. Verify that every prerequisite task has already been completed.
6. If a dependency is missing:
   - Stop.
   - Explain why implementation cannot continue.
   - Do not attempt a workaround.

---

## Phase 2 — Repository Analysis

Before modifying code, understand the existing implementation.

Review all affected areas including:

- Components
- Hooks
- Utilities
- Services
- State Management
- Routing
- API Layer
- Database
- Authentication
- Sync Engine
- Tests
- Documentation

Understand:

- Current architecture
- Existing data flow
- Current implementation patterns
- Reusable utilities
- Existing design system
- Experience Vision (`docs/EXPERIENCE_VISION.md`) — the target feeling the sprint must not violate.
- Screen Guidelines (`docs/SCREEN_GUIDELINES.md`) — the canonical composition and five states for every screen the sprint touches.
- Existing coding conventions

Do not redesign existing architecture unless absolutely required.

---

## Phase 3 — Implementation Plan

Before writing any code, generate a concise implementation plan.

Include:

### Sprint Objective

### Task Execution Order

### Files To Create

### Files To Modify

### Dependencies

### Potential Risks

### Validation Strategy

Only begin implementation after the plan is complete.

---

## Phase 4 — Implementation

Implement **every task** belonging to the requested Sprint.

Requirements:

- Production-ready implementation
- Maintain existing functionality
- Respect existing architecture
- Respect Design System
- Respect Accessibility guidelines
- Respect Performance guidelines
- Respect Security requirements
- Follow existing coding conventions
- Follow best practices
- Keep components modular and reusable

Do NOT:

- Implement another Sprint
- Skip acceptance criteria
- Leave TODOs
- Leave placeholder implementations
- Introduce unnecessary dependencies
- Modify unrelated functionality
- Rewrite working code without technical justification

---

## Continuous Quality Improvement

While implementing the current Sprint, you may discover issues that are directly related to the work being performed.

Examples include:

- Outdated documentation
- Missing architecture decisions
- Inconsistent naming
- Minor technical debt
- Small code quality issues
- Missing type safety
- Missing tests
- Minor accessibility issues
- Small performance improvements

You may improve these **only if they are necessary to complete the current Sprint safely and correctly.**

### Decision Rule

Before making improvements outside the Sprint tasks, ask:

1. Is this required to complete the current Sprint?
2. Does leaving it unchanged introduce bugs, regressions, architectural inconsistency, or poor developer experience?
3. Can it be fixed with a localized change without expanding the Sprint scope?

If the answer to all three is **YES**, implement the improvement.

Otherwise:

- Do NOT implement it.
- Record it under **Future Recommendations** in the Sprint Summary.

Rules:

- Keep improvements localized.
- Preserve backward compatibility.
- Do not perform unrelated refactoring.
- Do not redesign completed modules.
- Do not expand the Sprint scope.
- Document all improvements in:
  - CHANGELOG.md
  - Sprint Summary Report

Always prioritize completing the Sprint over making optional improvements.

---

## Phase 5 — Code Quality

Review the implementation for quality.

Ensure the code is:

- Modular
- Reusable
- Maintainable
- Readable
- Well documented
- Type-safe
- Accessible
- Responsive
- Performance-conscious

Avoid:

- Dead code
- Duplicate code
- Large components
- Magic numbers
- Tight coupling
- Console logs
- Unused imports
- Inconsistent naming

If better abstractions naturally emerge during implementation, use them only if they remain localized to the current Sprint.

---

## Phase 6 — Validation & Testing

Run or update all affected tests.

Verify:

- Existing tests pass
- New tests pass
- Build succeeds
- Lint succeeds
- TypeScript passes
- No runtime errors
- No console errors

Additionally verify:

- Existing functionality still works
- No regressions introduced
- Accessibility remains compliant
- Performance is not degraded

If any validation fails:

Fix it before considering the Sprint complete.

---

## Phase 7 — Documentation

Update every document affected by the implementation.

Examples include:

- CHANGELOG.md
- IMPLEMENTATION_QUEUE.md
- SPRINT_BOARD.md
- ARCHITECTURE.md
- DESIGN_SYSTEM.md
- AI_CONTEXT.md
- TESTING_CHECKLIST.md
- PRODUCTION_CHECKLIST.md
- RELEASE_NOTES.md

Only modify documentation that is actually affected.

Keep documentation synchronized with the codebase.

---

## Phase 8 — Sprint Report

Generate:

```
sprint-reports/SPRINT_<NUMBER>_SUMMARY.md
```

Include:

# Executive Summary

# Sprint Goal

# Completed Tasks

# Acceptance Criteria Status

# Files Created

# Files Modified

# Architecture Changes

# UI / UX Changes

# Backend Changes

# Database Changes

# API Changes

# Performance Improvements

# Accessibility Improvements

# Security Improvements

# Tests Added

# Documentation Updated

# Risks

# Known Issues

# Future Recommendations

# Validation Results

# Remaining Work

---

## Phase 9 — Sprint Completion Checklist

Before finishing verify:

✓ Every Sprint task is completed.

✓ Every acceptance criterion is satisfied.

✓ Build passes.

✓ Lint passes.

✓ Tests pass.

✓ TypeScript passes.

✓ Existing functionality still works.

✓ Documentation updated.

✓ Sprint report generated.

✓ No TODOs introduced.

✓ No placeholder implementations remain.

✓ No unrelated refactoring performed.

---

## Phase 10 — Final Output

Provide:

### Executive Summary

Summarize the Sprint implementation.

---

### Files Changed

List:

- Files Created
- Files Modified
- Files Deleted (if any)

---

### Validation

Summarize:

- Build
- Tests
- Lint
- Type Checking
- Accessibility
- Performance

---

### Remaining Work

Explain what remains for the next Sprint.

---

### Suggested Git Commit

Provide a Conventional Commit message.

Example:

```
feat(sync): complete Sprint 2.1 - sync instrumentation and diagnostics
```

---

## Stop Condition

After completing the requested Sprint:

STOP.

Do NOT implement the next Sprint.

Wait for:

- Review
- Testing
- Approval
- Commit

before continuing.
