# Plan: Instrumental Console Redesign

**Branch**: `018-instrumental-console` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

## Summary

Restyle and restructure the React frontend only. Keep Node API TabIds (`navigator` /
`infra` / `output`). Introduce a UI `ShellSection` mapped onto those tabs. Add Overview,
welcome modal, and guided tour as frontend modules with DOM-free config unit-tested.

## Technical approach

1. `web/src/tokens.css` - primitive + semantic CSS variables
2. `web/src/theme.ts` - map tokens into MUI `createTheme`
3. Shell components: `AppHeader`, `AppSidebar`, `OverviewView`, `WelcomeModal`, `GuidedTour`
4. `web/src/onboarding/` - persistence + tour step definitions
5. Polish SprintStatusView / PrdDetailView / ArchitectureDetailView / FrontmatterInfoControl

## Constitution check

- Spec-first: this folder satisfies Principle I for the redesign
- Read-only: onboarding only writes `localStorage`, never project files
- Test-first for tour step config / onboarding persistence helpers
