# Wiki

Handover notes for the **other** Gerillass repositories. This folder is not
about the library. It is what you give to a Claude Code session working on
`gerillass.com` or `docs.gerillass.com`, which has no knowledge of this
repository and cannot see what changed here.

One file per released version, named after it: `v2.1.0.md`.

## The one rule

**Never restate the API here.** `gerillass.json` already carries every
signature, every argument, every worked example and every refused input, and
the test suite compiles all of it, so it cannot describe a mixin the library
does not have. A wiki page that repeats that material is a second copy that
nothing checks, and it will drift.

What belongs here is everything the manifest cannot hold:

- what changed, and what it means for a page rather than for a stylesheet;
- **the measurements**. Most of what was added recently exists because
  something silently does not work, and that is the part a documentation page
  has to explain. The numbers are in these files because they were taken in a
  browser and nobody should have to take them again.
- which files and which controls in the other repositories need touching;
- how to check the result.

## The three places Gerillass is described

| Where | Repository | What lives there |
|---|---|---|
| The library | this one | `.scss` sources, `gerillass.json`, `SKILL.md`, `llms.txt` |
| The site | `gerillass.com` | landing page, **playground** |
| The documentation | `docs.gerillass.com` | one page per member |

The playground is the part that is easy to forget. It has two `<select>`
menus: one listing versions, one listing members. A release that adds a mixin
without adding it to the member menu leaves it invisible to anyone browsing.

## Related documents, and when to use those instead

- **`CHANGELOG.md`** is for users of the library. Written first, and these
  files assume it.
- **`MIGRATION.md`** is for upgrading a project across a breaking change. It
  covers 1.x to 2.0.0 and is linked from the release notes.
- **These files** are for updating the site and the documentation. Nobody
  outside the project reads them.

## Using one

Give the session the file and let it read the manifest for the API:

```
Read wiki/v2.1.0.md from
https://github.com/selfishprimate/gerillass/blob/main/wiki/v2.1.0.md
and make the updates it lists for this repository. Take signatures and
argument details from gerillass.json rather than from the wiki page.
```
