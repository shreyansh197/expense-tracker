# ExpenStream Production Checklist

## Purpose

This checklist defines everything required before a production release.

---

# Build

- [ ] Project builds successfully
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] No console errors
- [ ] Environment variables configured

---

# Performance

- [ ] Lighthouse Performance > 95
- [ ] Bundle optimized
- [ ] Images optimized
- [ ] Lazy loading verified
- [ ] Code splitting verified

---

# Accessibility

- [ ] WCAG AA compliant
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Focus indicators
- [ ] Touch targets

---

# PWA

- [ ] Installable
- [ ] Offline mode
- [ ] Service Worker verified
- [ ] Manifest validated
- [ ] Icons verified

---

# Security

- [ ] Authentication verified
- [ ] Authorization verified
- [ ] Input validation
- [ ] Rate limiting
- [ ] Secure storage

---

# Testing

- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual QA
- [ ] Mobile testing
- [ ] Desktop testing

---

# Release

- [ ] CHANGELOG updated
- [ ] RELEASE_NOTES updated
- [ ] Version bumped
- [ ] Git tag created
