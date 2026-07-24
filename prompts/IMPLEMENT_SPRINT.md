# ExpenStream ADK - Sprint Implementation Workflow

## Purpose

This document defines the standard implementation workflow for every development sprint.

Always read and follow `prompts/STANDARD_HEADER.md` before executing this workflow.

The documentation inside the `docs/` directory is the project's single source of truth.

Do not make assumptions.

---

# Sprint Execution Workflow

## Phase 1 — Understand the Sprint

1. Read `docs/IMPLEMENTATION_QUEUE.md`.
2. Locate the requested Sprint.
3. Read every task within the Sprint.
4. Understand:
   - Sprint Goal
   - Business Value
   - Technical Value
   - Dependencies
   - Acceptance Criteria
   - Affected Files
5. Verify that all prerequisite tasks have already been completed.
6. If a dependency is missing, stop and explain why implementation cannot continue.

---

## Phase 2 — Repository Analysis

Before modifying code, inspect all affected areas of the repository.

Understand:

- Current implementation
- Architecture
- Data flow
- State management
- APIs
- Database interactions
- Existing tests
- Related components
- Related hooks
- Related utilities

Do not rewrite existing architecture without justification.

---

## Phase 3 — Implementation Plan

Before writing code, generate a concise implementation plan.

Include:

- Sprint objective
- Task execution order
- Files to create
- Files to modify
- Dependencies
- Potential risks
- Testing strategy

Begin implementation only after the plan is complete.

---

## Phase 4 — Implementation

Implement **every task** belonging to the requested Sprint.

Requirements:

- Production-ready code
- Preserve existing functionality
- Maintain backward compatibility where applicable
- Follow the Design System
- Follow Architecture guidelines
- Follow coding standards
- Respect Accessibility requirements
- Respect Performance guidelines

Do NOT:

- Implement another Sprint
- Skip acceptance criteria
- Leave placeholder implementations
- Leave TODO comments
- Introduce unnecessary refactoring
- Modify unrelated files

---

## Phase 5 — Code Quality

Ensure the implementation is:

- Clean
- Modular
- Maintainable
- Reusable
- Type-safe
- Accessible
- Responsive
- Performance-conscious

Avoid:

- Duplicate code
- Dead code
- Large components
- Tight coupling
- Magic numbers
- Console logging
- Unused imports

---

## Phase 6 — Testing

Run or update all affected tests.

Verify:

- Existing tests pass
- New tests pass
- Build succeeds
- Lint succeeds
- No TypeScript errors
- No runtime errors
- No console errors

If tests fail:

Fix them before considering the Sprint complete.

---

## Phase 7 — Documentation

Update every affected document.

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

Only modify documents that are actually affected.

---

## Phase 8 — Sprint Report

Generate:

```
sprint-reports/SPRINT_<NUMBER>_SUMMARY.md
```

Include:

- Sprint Overview
- Completed Tasks
- Acceptance Criteria Status
- Files Created
- Files Modified
- Architecture Changes
- UI/UX Changes
- Backend Changes
- Database Changes
- Performance Improvements
- Accessibility Improvements
- Tests Added
- Documentation Updated
- Risks
- Known Issues
- Remaining Work
- Validation Results

---

## Phase 9 — Completion Checklist

Before finishing, verify:

- Every Sprint task is complete.
- Every acceptance criterion is satisfied.
- Documentation is updated.
- Tests pass.
- Build passes.
- Lint passes.
- Existing functionality still works.

---

## Phase 10 — Final Output

Provide:

### Executive Summary

A concise summary of the Sprint implementation.

### Files Changed

List every file created or modified.

### Validation

Summarize:

- Tests
- Build
- Lint
- Type checking

### Remaining Work

State what remains for the next Sprint.

### Suggested Commit Message

Provide a Conventional Commit message.

Example:

```
feat(sync): complete Sprint 2.1 - sync instrumentation and diagnostics
```

---

## Stop Condition

After completing the requested Sprint:

STOP.

Do not begin the next Sprint.

Wait for review, testing, and approval before continuing.
