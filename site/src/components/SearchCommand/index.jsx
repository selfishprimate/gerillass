import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Command } from "cmdk";

import { SearchIcon } from "components/Icons";
import { pages } from "virtual:docs-index";
import { SCRIM_MOTION, DIALOG_MOTION } from "animation";

import "./search-command.scss";

/*
  Search, as a command palette.

  Eighty documentation pages is more than a menu can hold and more than anyone
  wants to scroll, and the thing a reader is doing is looking for a name they
  half remember. The list comes from virtual:docs-index, the same module the
  sidebar reads, so it cannot fall behind the pages.

  cmdk does the keyboard and the accessibility: arrows move, Enter opens,
  Escape closes, and the listbox is announced. What is here is the data, the
  filtering and the styling.
*/

/*
  Mixins first, because that is what somebody opening a search box on this site
  is looking for: fifty-three of them against twenty-three functions and four
  guides. The guides are reachable from the sidebar on every page, so they sit
  at the bottom here rather than at the top.
*/
/*
  cmdk's Command forwards its ref to the element it renders, which is what
  lets framer drive it directly. Wrapping it in a motion div instead would put
  a box between the scrim's centring and the dialog it is centring.
*/
const MotionCommand = motion.create(Command);

const GROUPS = [
  { kind: "mixin", label: "Mixins" },
  { kind: "function", label: "Utilities" },
  { kind: "guide", label: "Overview" },
  { kind: "site", label: "Elsewhere" },
];

/*
  Words a page should answer to that are not in its title or its summary.

  "docs" and "documentation" are what people type when they want the
  documentation, and no page is called either. The playground is not a
  documentation page at all, so it is not in the list until somebody asks for
  it by name: `ONLY_WHEN_SEARCHED` holds the destinations that appear once
  there is a query and stay out of the opening list.
*/
const ALIASES = {
  introduction: "docs documentation guide reference api",
  installation: "install setup npm yarn getting started vite webpack",
  support: "help issue bug question slack discussions",
  license: "apache legal copyright",
};

const ONLY_WHEN_SEARCHED = [
  {
    slug: "playground",
    kind: "site",
    title: "Playground",
    href: "/playground",
    summary: "Write Sass against the library and watch the CSS compile.",
    alias: "editor try sandbox repl",
  },
];

function matches(page, needle) {
  if (!needle) return true;
  return (
    page.title.toLowerCase().includes(needle) ||
    (page.member && page.member.toLowerCase().includes(needle)) ||
    page.slug.includes(needle) ||
    (page.summary && page.summary.toLowerCase().includes(needle)) ||
    (ALIASES[page.slug] ?? page.alias ?? "").includes(needle)
  );
}

function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  /*
    The portal is mounted whether or not the palette is open, because
    AnimatePresence can only animate a child out if it is still there to be
    animated. That needs a document, and the build machine has none, so it
    waits for the first effect rather than for `open`.
  */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Cmd+K on a Mac, Ctrl+K everywhere else, which is what a reader who knows
  // this control will reach for without being told.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key?.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((was) => !was);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // The page behind the palette should not scroll while it is open.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const go = useCallback(
    (href) => {
      setOpen(false);
      setQuery("");
      navigate(href);
    },
    [navigate]
  );

  const needle = query.trim().toLowerCase();
  const groups = GROUPS.map(({ kind, label }) => ({
    label,
    items:
      kind === "site"
        ? needle
          ? ONLY_WHEN_SEARCHED.filter((page) => matches(page, needle))
          : []
        : pages.filter((page) => page.kind === kind && matches(page, needle)),
  })).filter((group) => group.items.length);

  const nothing = !groups.length;

  return (
    <>
      <button
        type="button"
        className="search-trigger"
        onClick={() => setOpen(true)}
        aria-label="Search the documentation"
      >
        <SearchIcon size={15} />
        Search
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open ? (
              <motion.div
                className="palette"
                variants={SCRIM_MOTION}
                initial="hidden"
                animate="shown"
                exit="hidden"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) setOpen(false);
                }}
              >
                <MotionCommand
                  className="palette__dialog"
                  /*
                    No initial, animate or exit of its own: a child with
                    variants follows its parent through the same three states,
                    so the scrim and the dialog cannot come apart.
                  */
                  variants={DIALOG_MOTION}
                  label="Search the documentation"
                  loop
                  /*
                    cmdk moves the selection and opens on Enter, but it does
                    not close: the dialog is ours, so Escape is ours to answer.
                  */
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.preventDefault();
                      setOpen(false);
                    }
                  }}
                >
                  <div className="palette__field">
                    <SearchIcon size={17} />
                    <Command.Input
                      value={query}
                      onValueChange={setQuery}
                      placeholder="Search mixins, functions, and pages"
                      className="palette__input"
                      autoFocus
                    />
                    <button
                      type="button"
                      className="palette__close"
                      onClick={() => setOpen(false)}
                      aria-label="Close search"
                    >
                      <kbd>Esc</kbd>
                    </button>
                  </div>

                  <Command.List className="palette__list">
                    {nothing ? (
                      <Command.Empty className="palette__empty">
                        Nothing matches “{query}”.
                      </Command.Empty>
                    ) : null}

                    {groups.map((group) => (
                      <Command.Group
                        key={group.label}
                        heading={group.label}
                        className="palette__group"
                      >
                        {group.items.map((page) => (
                          <Command.Item
                            key={page.slug}
                            /*
                              The member's own name goes in the value as well
                              as the title, so typing clearUnit finds the page
                              called Clear Unit. cmdk matches on this string.
                            */
                            value={`${page.title} ${page.member ?? ""} ${page.slug} ${
                              ALIASES[page.slug] ?? page.alias ?? ""
                            }`}
                            onSelect={() => go(page.href)}
                            className="palette__item"
                          >
                            <span className="palette__title">{page.title}</span>
                            <span className="palette__summary">
                              {page.summary}
                            </span>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    ))}
                  </Command.List>
                </MotionCommand>
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

export default SearchCommand;
