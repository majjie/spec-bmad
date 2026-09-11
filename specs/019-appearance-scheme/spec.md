# Feature Specification: Light and Dark Appearance

**Feature Branch**: `019-appearance-scheme` (implemented on `ux-polish-console`)

**Created**: 2026-09-11

**Status**: Retrofitted

**Input**: User description: "Let the console be used in a light room. Follow the operating
system's appearance by default, let the reader override it from the header, remember that
choice, and never flash the wrong appearance while loading."

> **Retrofit note**: reconstructed from an already-implemented branch rather than written
> ahead of it, so it did not gate the work it describes (constitution Principle I). It builds
> directly on the semantic token layer introduced by feature 018, which is a prerequisite.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Match the room I am working in (Priority: P1)

A developer working in a bright room opens the tool and finds it already light, because
their operating system is set to a light appearance. A colleague on a dark desktop opens the
same tool and finds it dark. Neither had to configure anything.

**Why this priority**: A tool that is readable only in one lighting condition is unusable in
the other. Following the system preference is what makes this correct for most people
without asking them anything.

**Independent Test**: Set the operating system to light, open the tool, and confirm the
interface is light; switch the system to dark and confirm the tool follows without a reload.
Delivers correct appearance with zero interaction.

**Acceptance Scenarios**:

1. **Given** a reader whose system requests a light appearance and who has never chosen one
   here, **When** the tool loads, **Then** the interface renders light.
2. **Given** a reader whose system requests a dark appearance, **When** the tool loads,
   **Then** the interface renders dark.
3. **Given** the tool is open and following the system, **When** the reader changes their
   system appearance, **Then** the interface follows immediately without a reload.

---

### User Story 2 - Override and have it remembered (Priority: P1)

A developer whose system is dark but who prefers to read documents on a light background
switches appearance from the header. It changes immediately, and it is still their
appearance the next time they open the tool - even though their system has not changed.

**Why this priority**: Equal to US1. Following the system is the right default but the wrong
rule for the substantial number of people whose preference for a document reader differs
from their preference for their desktop.

**Independent Test**: Switch appearance from the header, reload, and confirm the override
survives. Delivers reader control independently of the system-following behavior.

**Acceptance Scenarios**:

1. **Given** any appearance, **When** the reader activates the appearance control, **Then**
   the interface switches to the other appearance immediately.
2. **Given** the reader has overridden the appearance, **When** they reload, **Then** their
   choice is still in effect.
3. **Given** the reader has overridden to light on a dark system, **When** the system
   appearance changes, **Then** their override is **not** overridden by it.
4. **Given** a browser that refuses to remember preferences, **When** the reader switches
   appearance, **Then** the switch still works for the session and the tool does not fail.

---

### User Story 3 - No flash of the wrong appearance (Priority: P2)

A developer who reads in light mode never sees a dark flash while the page loads, and vice
versa. The first thing painted is already the right appearance.

**Why this priority**: A flash is not a correctness bug - the interface settles correctly
either way - but on a tool opened many times a day it is the most conspicuous possible
defect, and it is jarring in exactly the lighting condition the reader chose to avoid.

**Independent Test**: With a stored light preference, reload repeatedly with the network
throttled and confirm no dark frame is ever painted.

**Acceptance Scenarios**:

1. **Given** a stored appearance preference, **When** the page loads, **Then** the first
   painted frame is already in that appearance.
2. **Given** no stored preference, **When** the page loads, **Then** the first painted frame
   matches the system preference.
3. **Given** preference storage throws during page load, **When** the page loads, **Then** a
   defined appearance is still applied and the page renders normally.

---

### User Story 4 - Legible in both appearances (Priority: P2)

Neither appearance is a naive inversion of the other. The light appearance uses muted, warm
surfaces rather than stark white, keeps its own accent colour, and preserves the contrast and
status legibility the dark appearance has.

**Why this priority**: A light mode produced by inverting a dark palette is typically
glaring and low-contrast. Getting this wrong makes US1 technically satisfied and practically
useless.

**Independent Test**: Review both appearances against contrast requirements and confirm no
surface is pure white and no status becomes indistinguishable.

**Acceptance Scenarios**:

1. **Given** the light appearance, **When** any surface renders, **Then** it uses a muted
   tone rather than pure white.
2. **Given** either appearance, **When** body text and focus indicators render, **Then** they
   meet AA contrast.
3. **Given** either appearance, **When** statuses render, **Then** each remains
   distinguishable from the others.

### Edge Cases

- Preference storage is blocked or throws: the tool still applies a defined appearance and
  remains usable; only the memory of the choice is lost.
- The system exposes no appearance preference at all: the tool applies a defined default
  rather than rendering unstyled.
- The reader's system requests reduced motion: switching appearance does not animate.
- A stored preference is unrecognised (hand-edited, or from a future version): it is treated
  as "follow the system" rather than being applied blindly.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The tool MUST support two appearances, light and dark, across every view.
- **FR-002**: With no explicit reader choice, the tool MUST follow the operating system's
  requested appearance.
- **FR-003**: While following the system, the tool MUST react to a change in the system
  preference without requiring a reload.
- **FR-004**: The header MUST offer a control that switches to the other appearance, labelled
  so that its effect is clear before activation.
- **FR-005**: An explicit reader choice MUST be remembered across sessions in the same
  browser, and MUST take precedence over the system preference.
- **FR-006**: An unrecognised stored preference MUST be treated as "follow the system".
- **FR-007**: The first painted frame MUST already be in the correct appearance - no flash of
  the other one.
- **FR-008**: If preference storage is unavailable, the tool MUST still apply a defined
  appearance and remain fully usable for the session.
- **FR-009**: Appearance MUST be expressed by remapping the shared semantic token layer only;
  no view may define appearance-specific colours of its own.
- **FR-010**: The light appearance MUST use muted surfaces rather than pure white, and MUST
  define its own accent rather than reusing the dark appearance's.
- **FR-011**: Both appearances MUST meet AA contrast for body text and focus indicators.
- **FR-012**: Both appearances MUST keep every status distinguishable from the others.
- **FR-013**: Switching appearance MUST NOT animate when the reader's system requests reduced
  motion.

### Key Entities

- **Appearance preference**: what the reader has asked for - light, dark, or follow the
  system. Persisted per browser.
- **Resolved appearance**: what is actually shown - always light or dark, never "follow the
  system". Derived from the preference and the current system setting.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With no stored choice, the tool's appearance matches the system's in 100% of
  loads.
- **SC-002**: An explicit choice survives reloads and is never overridden by a subsequent
  system change.
- **SC-003**: No frame in the wrong appearance is painted on load, at any network speed.
- **SC-004**: Body text and focus indicators meet WCAG 2.1 AA contrast in **both**
  appearances.
- **SC-005**: Every status remains distinguishable in both appearances, and in greyscale.
- **SC-006**: Adding a future appearance would require changing only the shared token layer,
  not any individual view.

## Assumptions

- Written after the implementation it describes; it documents delivered behavior rather than
  gating it (constitution Principle I not satisfied - see plan.md).
- Feature 018's semantic token layer is a prerequisite. This feature adds a second mapping of
  that layer; it does not introduce the layer itself.
- Only two appearances are in scope. The preference type admits "follow the system" as a
  third *preference*, but it always resolves to one of the two.
- The reader's browser is the unit of memory. Appearance is not synchronised across devices.
- This feature does not change what any view contains - only how it is coloured.
