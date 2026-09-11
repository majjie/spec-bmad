# Research: Light and Dark Appearance

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-09-11

> **Retrospective**: decisions taken during implementation, reconstructed by reading it.

## 1. Three preferences, two appearances

**Decision**: The stored preference is one of **light**, **dark**, or **system**; the
*resolved* appearance is only ever light or dark. Resolution is a pure function of the
preference and the current system setting.

**Rationale**: "Follow the system" is a real, distinct third answer, and it is the correct
default. Collapsing it into a two-valued preference forces a false choice at first load:
either store nothing and lose the ability to distinguish "never chose" from "chose dark", or
store a guess that then stops tracking the system. Keeping the preference three-valued and
the appearance two-valued makes FR-002 and FR-005 independently expressible.

**Alternatives considered**:

- *Boolean `isDark`* - rejected; cannot represent "follow the system", so a reader whose
  system flips would be stranded on whatever was captured at first load.
- *Store the resolved appearance and re-resolve on every load* - rejected; it silently
  converts a system-follower into an overrider the moment anything writes.

## 2. What the toggle does with three preferences

**Decision**: The control always switches to **the opposite of what is currently shown**, and
always writes an explicit preference. It never cycles through a three-state list.

**Rationale**: The reader's mental model is "make it light" / "make it dark", not "advance
the preference enumeration". Resolving first and then inverting means the control's effect is
always predictable from what the reader can see - which is what FR-004 requires of its label.
A three-state cycle would put "system" in the rotation, where activating it appears to do
nothing whenever the system already agrees with the current appearance.

**Alternatives considered**:

- *Cycle light → dark → system* - rejected for the invisible-transition problem above.
- *A menu offering all three* - rejected as disproportionate chrome for a header control;
  "follow the system" remains reachable by never having chosen, which is the state that
  matters. (Clearing an override is, admittedly, not reachable from the interface - noted as
  a limitation in `contracts/ui-behavior.md` rather than solved here.)

## 3. Preventing the flash requires a pre-paint script

**Decision**: A small synchronous script in the page head resolves the appearance and stamps
it on the document element before the application bundle loads.

**Rationale**: This is the only mechanism that can satisfy FR-007. A module bundle is
deferred by definition: by the time any component runs, the browser has already painted at
least one frame using whatever the stylesheet's default appearance is. For a reader who chose
light on a tool whose default is dark, that frame is a full-page dark flash on every single
load - the most conspicuous defect available, in exactly the lighting condition they chose to
avoid.

The script duplicates a small amount of resolution logic that also exists in the typed
module. That duplication is deliberate and is the cost of the constraint: the typed module
cannot run early enough. It is bounded to reading one key and applying one attribute, and the
storage key is the coupling to keep an eye on - `data-model.md` § 1 names it as the single
value both halves must agree on.

**Alternatives considered**:

- *Resolve in the application's entry point* - rejected; still after first paint.
- *Default the stylesheet to light and accept a flash for dark readers* - rejected; it does
  not remove the flash, only chooses whom to inflict it on.
- *Server-render the appearance into the served HTML* - rejected; the server has no knowledge
  of the reader's preference, which lives in their browser, and this tool deliberately has no
  per-reader server state.
- *Import the typed module as a classic non-deferred script* - rejected; it would require a
  second, differently-configured build output for a dozen lines of logic.

## 4. The light appearance is designed, not inverted

**Decision**: Light is a distinct palette - warm sand surfaces, a cool mist for chrome, ink
text, and a slate-blue accent - rather than the dark palette's ramps reversed. The dark
appearance keeps its amber accent; light uses slate-blue.

**Rationale**: Inverting a dark palette produces pure-white surfaces and an accent tuned for
emission rather than reflection. The result is glaring at the exact moment it is meant to be
comfortable, and the accent typically fails contrast against a light surface. Amber on
near-white is the specific failure here: it is legible on charcoal and washes out on sand,
which is why light gets its own accent rather than a lightened version of the same hue
(FR-010).

Only the **semantic** tier is remapped. The primitive tier gains new ramps for light to draw
on, but no component changes, which is what FR-009 and SC-006 require.

**Alternatives considered**:

- *Programmatic inversion or a lightness flip* - rejected for the reasons above; it is the
  approach that makes light modes feel like an afterthought.
- *One accent across both appearances* - rejected; no single hue holds AA contrast against
  both a near-black and a near-white surface without becoming muddy on one of them.
- *Pure white surfaces* - rejected explicitly by FR-010; a document reader is looked at for
  long stretches and unrelieved white is fatiguing.

## 5. Tracking the system preference live

**Decision**: Subscribe to the system appearance query and update state on change, so a
system-following reader sees the change immediately (FR-003). An explicit override wins and
is unaffected by the subscription.

**Rationale**: The common case for a live change is an operating system that switches at
sunset. A reader with the tool open would otherwise sit in the wrong appearance until they
happened to reload - the one moment the feature most obviously ought to act.

The override precedence falls out of the resolution function rather than being special-cased
in the subscription: the subscription only updates *what the system says*, and resolution
decides whether that matters. That keeps the rule in one testable place.

**Alternatives considered**:

- *Read the system preference once at startup* - rejected for the sunset case.
- *Unsubscribe when an override is set* - rejected as a false optimisation; it adds a second
  piece of state to keep consistent, and the system value must still be correct if the
  override is ever cleared.

## 6. Unrecognised stored values fall back to the system

**Decision**: A stored value that is not one of the known preferences is treated as "follow
the system" (FR-006).

**Rationale**: The stored value is in a storage area the reader can edit and that a future
version of this tool may write differently. The safe reading of an unknown value is the
default behavior, not a guess - and "follow the system" is the only option that is never
wrong for long, since the reader can immediately override it.

**Alternatives considered**:

- *Treat unknown as dark* - rejected; it silently strands a light-appearance reader.
- *Clear the stored value on encountering an unknown one* - rejected; a write performed on a
  read path, which would also discard a preference a future version might understand.

## 7. Testing appearance without a browser

**Decision**: Unit-test the resolution and persistence rules directly, and assert the light
token block's mapping by reading `tokens.css` as text.

**Rationale**: The resolution rules are the part with real logic and they are pure, so they
test cleanly. The token block has no logic at all - its correctness is a mapping, and the
only assertion available without a rendering harness is that the mapping says what it should.

This second kind of test is **weaker than it looks** and should be understood as a guard
against accidental deletion or a careless find-and-replace, not as evidence that the
appearance is legible. It pins specific primitive choices, which means a deliberate palette
revision must edit the test too - acceptable friction for a block that is otherwise entirely
unguarded, but it is not a contrast check. SC-004 is verified manually in `quickstart.md`,
and nothing in the automated suite can currently replace that.

**Alternatives considered**:

- *No tests for the token block* - rejected; it is a large block of text that a bulk edit
  could silently damage, as this branch's own history demonstrates elsewhere.
- *Computed-contrast assertions in a headless browser* - the genuinely correct answer for
  SC-004, and rejected here only as disproportionate: it means a browser-based harness and a
  new dependency, weighed against Principle III. Worth revisiting if a third appearance is
  ever added.
