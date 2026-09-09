import { fileURLToPath, URL } from "node:url";
import * as sass from "sass";
import { visit } from "unist-util-visit";

/*
  Compiles the Sass inside an <Example> while the page is being built, and
  hands the component its three parts as props.

  A page is written like this:

      <Example caption="The default ratio is 16/9.">
      ```scss
      .element { @include aspect-ratio("16:9"); }
      ```
      ```html
      <img class="element" src="/images/backgrounds/06.jpg" alt="" />
      ```
      </Example>

  and reaches the component with `source`, `css` and `html` already filled in.
  The author writes the call and the markup; the CSS is never typed.

  This is the whole reason the documentation moved into the library's
  repository. The pages it replaces carry their compiled CSS as a hand-copied
  block -- 143 of them -- and a mixin can change underneath one without
  anything noticing. Here the page is compiled against the library beside it,
  so a stale block is a failed build.

  The fenced blocks are consumed rather than rendered: they become the props,
  and the component decides how to show them. A block in a language this does
  not know is left alone, so a page can still show a snippet of JSON or a
  terminal command inside an example.
*/

const LIBRARY = fileURLToPath(new URL("../../scss", import.meta.url));

export default function remarkCompileExamples() {
  return (tree, file) => {
    visit(tree, "mdxJsxFlowElement", (node) => {
      if (node.name !== "Example") return;

      const taken = [];
      let scss = null;
      let html = null;

      for (const child of node.children) {
        if (child.type !== "code") continue;
        if (child.lang === "scss" && scss === null) {
          scss = child.value;
          taken.push(child);
        } else if (child.lang === "html" && html === null) {
          html = child.value;
          taken.push(child);
        }
      }

      if (scss === null) {
        file.fail("An <Example> needs a ```scss block: it is what gets compiled.", node);
      }

      /*
        The library is loaded for the compile but not shown. A reader wants the
        call, and the pages this replaces open on the call too -- the `@use`
        line is boilerplate every example on the site would repeat. A snippet
        that loads the library itself is left alone, so a page can still
        demonstrate namespacing.
      */
      /*
        A `setup` attribute is Sass that has to run before the example does but
        is not part of what the example shows. One mixin needs it: loadify
        defines a placeholder under `loadify(init)` and every later call
        @extends it, so a call compiled on its own fails with "the target
        selector was not found". The page states that requirement in prose; the
        attribute is what makes the example beside it actually compile.
      */
      const setup = node.attributes.find(
        (a) => a.type === "mdxJsxAttribute" && a.name === "setup"
      )?.value;

      const loads = /^\s*@(use|import)\s/m.test(scss);
      const preamble = [loads ? null : '@use "gerillass" as *;', setup]
        .filter(Boolean)
        .join("\n");
      const toCompile = preamble ? `${preamble}\n${scss}` : scss;

      let css;
      try {
        css = sass.compileString(toCompile, {
          loadPaths: [LIBRARY],
          style: "expanded",
          // The library's own deprecations are not this page's subject.
          // if-function is the one it still trips; see the root CLAUDE.md.
          silenceDeprecations: ["if-function"],
        }).css;
      } catch (error) {
        file.fail(
          `An <Example> failed to compile.\n\n${error.message}\n\nThe Sass was:\n${toCompile}`,
          node
        );
      }

      node.children = node.children.filter((child) => !taken.includes(child));

      node.attributes.push(
        { type: "mdxJsxAttribute", name: "source", value: scss.trimEnd() },
        { type: "mdxJsxAttribute", name: "css", value: css.trimEnd() }
      );
      if (html !== null) {
        node.attributes.push({ type: "mdxJsxAttribute", name: "html", value: html.trim() });
      }
    });
  };
}
