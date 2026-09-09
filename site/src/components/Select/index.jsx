import React from "react";
import { AnimatePresence } from "framer-motion";

import { ChevronDownIcon } from "components/Icons";
import Tooltip from "components/Tooltip";

import "./select.scss";

/*
  A labelled select. Native underneath — the platform's own picker is better on
  a phone than anything rebuilt here — with the browser's arrow replaced so the
  control can carry the site's shapes and spacing.

  `options` are `{ value, label }`; `placeholder` is an entry for the empty
  value, kept in the list rather than hidden once something else is chosen, so
  it stays somewhere to go back to.
*/
function Select({
  label,
  value,
  options,
  onChange,
  disabled = false,
  placeholder,
  tone = "light",
  compact = false,
  bare = false,
  hideLabel = false,
  className,
  describe,
  describeAlign = "left",
  showDescription = false,
}) {
  /*
    A control whose name is hidden can say what it is in a bubble underneath —
    but only when whoever owns it asks. Somebody who has understood the bar
    does not need telling again every time the pointer crosses it.
  */
  const described = Boolean(describe) && showDescription;
  /*
    A native select is as wide as its widest option, which leaves the chevron
    stranded far from a short selection. The control is sized from the label it
    is actually showing instead: the same text, in the same face, is printed
    invisibly behind it and the select is laid over the top.

    A value with no option of its own is what the browser itself would show —
    the placeholder if there is one, otherwise the first entry.
  */
  const selected =
    options.filter((option) => String(option.value) === String(value))[0];
  const shown = selected
    ? selected.label
    : placeholder || (options[0] && options[0].label) || "";

  const classes = [
    "select",
    tone === "dark" ? "select--dark" : "",
    compact ? "select--compact" : "",
    bare ? "select--bare" : "",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label className={classes} title={hideLabel ? label : undefined}>
      <span
        className={`select__label${hideLabel ? " select__label--hidden" : ""}`}
      >
        {label}
      </span>
      <span className="select__field">
        <span className="select__sizer" aria-hidden="true">
          {shown}
        </span>
        <select
          className="select__control"
          value={value}
          onChange={onChange}
          disabled={disabled || !options.length}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon size={16} className="select__arrow" />
        <AnimatePresence>
          {described && (
            <Tooltip key="description" align={describeAlign}>
              {describe}
            </Tooltip>
          )}
        </AnimatePresence>
      </span>
    </label>
  );
}

export default Select;
