# Comments in the library source

Whether the `.scss` files should carry comments written for the people and
agents who read them, which ones, and in what order.

Measured 13 September 2026 against gerillass v2.1.0, after the first trial
project in which an agent built a site with the library and wrote feedback on
it. The trial used Claude Opus 5 and the installed Dart Sass was 1.104.1.

---

## Why this came up

The agent in the trial did not read the documentation site. It read the source
in `node_modules`, and its feedback quoted source comments by name: the reason
`fluid` keeps a `rem` term in its preferred value, the note in `container` that
a query does not match the element it is declared on. It praised those members
and called that tone of comment what sets the library apart.

The comments are also the one channel that needs no install step. The `.scss`
files ship in the package, and an agent debugging a call is already reading the
file the comment sits in.

## What the measurement says

| | Files | With any comment |
|---|---:|---:|
| `scss/library` and `scss/utilities` | 78 | 15 |
| Members the agent praised | 6 | 6 |
| Members the agent tripped on | 10 | 0 |

Praised, with their comment lines: `fluid` 25, `line-clamp` 16, `aspect-ratio`
10, `container-query` 9, `container` 8, `loadify` 4.

Tripped on, all at zero: `triangle`, `before`, `after`, `counter`,
`columnizer`, `adaptive`, `brand-logo`, `position`, `remove`, `breakpoint`.

**Do not read this as cause and effect.** The commented members are also the
newest and the best designed; the comments and the quality arrived together.
What the trial does show is that where comments existed, the agent used them.

## Which comments earn their place

The ones the agent quoted all say something the code cannot: why it is written
this way, the trap it closes, what was measured, what fails without a sound.

The ones that do not earn it restate what the code does or what the signature
is. That is already in `gerillass.json`, where the suite compiles it. A comment
repeating it is an unchecked second copy that goes stale, which is the same
reason `wiki/` is not allowed to restate the API.

## Proposed rules

1. **`//` only, never `/* */`, anywhere in the library.** A block comment
   inside a mixin is emitted into the user's compiled CSS. This is not a guess:
   `_reset-css.scss` has two, and both were in the trial's `main.css`, at lines
   67 and 92. Fix those two as part of this work.
2. **The comment explains, `meta/` proves.** A behavioural trap goes in the
   comment for the reader who has the file open, and into `meta/` so it reaches
   `SKILL.md` and can be checked. `meta/` has no field for that today; the
   manifest carries `name, kind, arguments, file, signature, summary, examples,
   rejects` and nothing for caveats. Adding one is a prerequisite for this rule.
3. **A comment is not a fix.** It is the right tool for behaviour that is
   deliberate or not the library's to change: `before` with no argument emitting
   no `content`, Sass placing a nested `@media` before the declarations after
   it. It is the wrong tool for a defect. `validateLength` warning on `null` and
   `isColor` rejecting `var()` should be fixed, not annotated.
4. **Write the convention down.** Neither `CONTRIBUTING.md` nor the `/new-mixin`
   skill says a word about comments, which is how a new member reproduces the
   gap.

## Order

1. The ten members the agent tripped on, each comment naming its trap.
2. The two block comments in `_reset-css.scss`, turned into `//` or removed.
3. The convention, in `CONTRIBUTING.md` and the `/new-mixin` checklist.
4. The rest of the library as each file is next touched, not in one pass. A
   pass over every file at once is the surest way to produce comments that carry
   nothing.

## How to tell whether it worked

Comments only reach an agent once they are published, since the trials install
from npm. A trial running while this is written, on Claude Fable 5.1, is
installing 2.1.0 and will not see anything added to the repository.

To measure the effect, run the same prompt after a release that carries the
comments and compare what the agent trips on. Hold the prompt and the model
fixed across the two runs, or a difference cannot be attributed to the
comments.

## Limits

- The praised and tripped-on lists come from one trial with one model. A second
  trial may move members between them.
- Comment lines were counted by pattern (`//`, `/*`, `*` at the start of a
  line), so a commented-out line of code counts as a comment.
