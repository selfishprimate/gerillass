import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";

import {
  SearchIcon,
  ArrowUpDownIcon,
  CornerDownLeftIcon,
} from "components/Icons";
import { pages } from "virtual:docs-index";

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

const GROUPS = [
  { kind: "guide", label: "Overview" },
  { kind: "mixin", label: "Mixins" },
  { kind: "function", label: "Utilities" },
];

/*
  The places on the site that are not documentation pages. Few enough to write
  down, and they would be strange to leave out of a search box.
*/
const SITE = [
  { slug: "home", title: "Home", href: "/", summary: "The landing page." },
  {
    slug: "playground",
    title: "Playground",
    href: "/playground",
    summary: "Write Sass against the library and watch the CSS compile.",
  },
];

function matches(page, needle) {
  if (!needle) return true;
  return (
    page.title.toLowerCase().includes(needle) ||
    (page.member && page.member.toLowerCase().includes(needle)) ||
    page.slug.includes(needle) ||
    (page.summary && page.summary.toLowerCase().includes(needle))
  );
}

function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

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
  const site = SITE.filter((page) => matches(page, needle));
  const groups = GROUPS.map(({ kind, label }) => ({
    label,
    items: pages.filter((page) => page.kind === kind && matches(page, needle)),
  })).filter((group) => group.items.length);

  const nothing = !site.length && !groups.length;

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

      {open &&
        createPortal(
          <div
            className="palette"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <Command
              className="palette__dialog"
              label="Search the documentation"
              loop
              /*
                cmdk moves the selection and opens on Enter, but it does not
                close: the dialog is ours, so Escape is ours to answer.
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
                  placeholder="Search mixins, functions and guides"
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

                {site.length ? (
                  <Command.Group heading="Site" className="palette__group">
                    {site.map((page) => (
                      <Command.Item
                        key={page.slug}
                        value={`site ${page.title} ${page.slug}`}
                        onSelect={() => go(page.href)}
                        className="palette__item"
                      >
                        <span className="palette__title">{page.title}</span>
                        <span className="palette__summary">{page.summary}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
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
                          The member's own name goes in the value as well as the
                          title, so typing clearUnit finds the page called Clear
                          Unit. cmdk matches on this string.
                        */
                        value={`${page.title} ${page.member ?? ""} ${page.slug}`}
                        onSelect={() => go(page.href)}
                        className="palette__item"
                      >
                        <span className="palette__title">{page.title}</span>
                        <span className="palette__summary">{page.summary}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>

              <div className="palette__footer">
                <span>
                  <kbd>
                    <ArrowUpDownIcon size={12} />
                  </kbd>
                  to navigate
                </span>
                <span>
                  <kbd>
                    <CornerDownLeftIcon size={12} />
                  </kbd>
                  to open
                </span>
                <span>
                  <kbd>Esc</kbd>
                  to close
                </span>
              </div>
            </Command>
          </div>,
          document.body
        )}
    </>
  );
}

export default SearchCommand;
