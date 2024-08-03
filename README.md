# `monkey-write`

A Web Component for
helping infinite monkeys
write Hamlet (or whatever).

## Features

This is a text editor
that only allows users to write
a pre-defined text.
Depending on the settings,
that might be easy
(incorrect keystrokes are replaced with valid characters)
or extremely difficult,
or anywhere between.

**[Demo](https://mirisuzanne.github.io/monkey-write/index.html)**

[![Open in StackBlitz][]](https://stackblitz.com/~/github.com/mirisuzanne/monkey-write?file=monkey-write.js&initialPath=/index.html)

[Open in StackBlitz]: https://developer.stackblitz.com/img/open_in_stackblitz.svg

## Examples

General usage example:

```html
<script type="module" src="monkey-write.js"></script>

<monkey-write>
  <template>A monkey hitting keys at random for an infinite amount of time will eventually want some help writing Hamlet (or whatever). You're the monkey. We're here to help.<template>
</monkey-write>
```

Provide an accessible label
for the `textarea` using either
`slot="label"` or the `data-label` attribute:

```html
<monkey-write>
  <span slot="label">Only write what we let you</span>
  <template>…</template>
</monkey-write>
```

```html
<monkey-write data-label="Only write what we let you">
  <template>…</template>
</monkey-write>
```

By default…

- Capitalization is ignored
- The space bar will insert any needed whitespace or punctuation
- A hint is provided after 15 failed keystrokes

The `data-hint` and and `data-cheat` attributes
control this behavior:

- `data-hint="<number>"`:
  change the number a incorrect keystrokes
  before a hint is provided
- `data-hint="false"`:
  turn off hints entirely
- `data-cheat="true"`:
  all keystrokes are 'corrected'
  to enter the next required character
- `data-cheat="false"`:
  no help with capitalization,
  white space, or punctuation
- `data-cheat="hyper"`:
  every keystroke enters
  between 4-24 correct characters

## Installation

You have a few options (choose one):

1. Install via
   [npm](https://www.npmjs.com/package/@terriblemia/monkey-write):
   `npm install @terriblemia/monkey-write`
2. [Download the source manually from GitHub](https://github.com/mirisuzanne/monkey-write/releases)
   into your project.
3. Skip this step
   and use the script directly
   via a 3rd party CDN
   (not recommended for production use)

## Usage

Make sure you include the `<script>` in your project
(choose one, and update the version number as needed):

```html
<!-- Host yourself -->
<script type="module" src="monkey-write.js"></script>
```

```html
<!-- 3rd party CDN, not recommended for production use -->
<script
  type="module"
  src="https://www.unpkg.com/@terriblemia/monkey-write@1.0.0/monkey-write.js"
></script>
```

```html
<!-- 3rd party CDN, not recommended for production use -->
<script
  type="module"
  src="https://esm.sh/@terriblemia/monkey-write@1.0.0"
></script>
```

Or use the built in
[WebC](https://www.11ty.dev/docs/languages/webc/) component
with [Eleventy](https://www.11ty.dev/docs/),
by adding `"npm:@terriblemia/monkey-write/*.webc"`
to the Eleventy WebC Plugin `components` registry:

```js
// Only one module.exports per configuration file, please!
module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(eleventyWebcPlugin, {
    components: [
      // Add as a global WebC component
      "npm:@11ty/monkey-write/*.webc",
    ],
  });
}
```

# Slots

The default slot is used to access
the provided `<template>`,
but otherwise not rendered
once the component is defined.
That slot
can be used for fallback content.

Content in the named `label` slot
will be rendered _inside a `<label>` element_,
before the `<textarea>`.

### Parts and styles

There are several parts involved:

- `::part(editor)`:
  the `<textarea>` used for typing
- `::part(label)`:
  a `<label>` that is hidden
  unless content is added
  to the `label` slot
- `::part(hint)`:
  a popup that appears
  after a number of given number
  of incorrect keystrokes
  (by adding/removing a `::part(hidden)` name),
  with several sub-parts…

  - `::part(hint-text)`:
    a container (`<span>`)
    for the text of the hint
  - `::part(hint-close)`:
    a button (`<button>`) for
    dismissing the hint popup

The `monkey-write` host element
is set to `display: block` by default,
with `position: relative`
to contain the hint.

The `::part(editor)` has no default styling,
apart from the user-agent `textarea` styles.
I recommend overriding a few of them:

```css
/* paste this if you want it */
monkey-write::part(editor) {
  field-sizing: content;
  font: inherit;
  inline-size: 100%;
  resize: none;

  /* if needed, adjust as desired */
  min-block-size: 6lh;
  padding: clamp(8px, 0.5lh, 24px);
}
```

Only `::part(hint)` has significant default styling
to make the popover legible by default:

```css
/* default styles in the shadow dom */
[part~=hint] {
  background: Canvas;
  border: thin solid;
  color: CanvasText;
  display: grid;
  grid-gap: 1ch;
  grid-template-columns: 1fr auto;
  inset: var(--hint-inset, auto 0 0 auto);
  margin: clamp(8px, 0.25lh, 24px);
  padding: clamp(8px, 0.25lh, 24px);
  position: absolute;
}
[part~=hidden] { display: none; }
```

The `--hint-inset` property
can be used to re-position the hint
(bottom right by default),
or any of the styles can be overridden.
By overriding styles on
`::part(hint hidden)`,
it's possible to create hint-popup
entrance and exit animations.

## Properties and events

Read/write properties:

- `MonkeyWrite.editor`:
  a keyboard input element
  that provides an `input` event
  and `value` property.
  By default, this will be
  the provided shadow-DOM `textarea`.
- `MonkeyWrite.srcText`:
  the text to write.
  By default,
  this is extracted from
  the first slotted `<template>` element.

Write-only properties:

- `MonkeyWrite.labelText` (string):
  place new text into the provided
  shadow-DOM `<label>`
- `MonkeyWrite.hit` (boolean):
  log a hit or miss keystroke.
  This will update the stats,
  and trigger a `write` event
  (described below).
- `MonkeyWrite.try` (string):
  attempt a keystroke.
  This will check for validity,
  and apply any required cheats
  before updating our progress,
  and registering a hit or miss.

Read-only properties:

- `MonkeyWrite.isValid` (boolean):
  `true` if the current `editor.value` is valid,
  by comparing it against
  the `srcText`
- `MonkeyWrite.progress` (string):
  the latest valid value
  that was entered
- `MonkeyWrite.remaining` (string):
  what's left of the `srcText`
  that still hasn't been entered
- `MonkeyWrite.next` (string):
  the next expected character to type
- `MonkeyWrite.nextIsSpecial` (boolean):
  `true` if the next character
  is white space or punctuation
- `MonkeyWrite.stats` (object):
  - `total` (integer): length of `MonkeyWrite.srcText`
  - `progress` (integer): length of `MonkeyWrite.progress`
  - `remaining` (integer): length of `MonkeyWrite.remaining`
  - `next` (string): next expected character
  - `prev` (string): last entered character (after cheats are applied)
  - `missed` (integer): current streak of incorrect keystrokes
    (resets to `0` when a correct character is entered)
  - `wasted` (integer): total incorrect keystrokes over time

Events:

The `monkey-write` element listens for
`input` events on the `editor`,
and emits a custom `write` event
every time a `hit` (or miss) is recorded.
The `write` event bubbles,
and contains an updated `stats` object
in the `event.details` property.

## Support

At [OddBird](https://oddbird.net/),
we enjoy collaborating and contributing
as part of an open web community.
But those contributions take time and effort.
If you're interested in supporting our
open-source work,
consider becoming a
[GitHub sponsor](https://github.com/sponsors/oddbird),
or contributing to our
[Open Collective](https://opencollective.com/oddbird-open-source).

❤️ Thanks!

## Credit

With thanks to the following people:

- [David Darnes](https://darn.es/) for the
  [Web Component repo template](https://github.com/daviddarnes/component-template)
  that this one is based on.
