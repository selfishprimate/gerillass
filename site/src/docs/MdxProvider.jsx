import React from "react";
import { MDXProvider } from "@mdx-js/react";

import Example from "./Example";
import Member from "./Member";
import Arguments, { Argument } from "./Arguments";
import Hint from "./Hint";

/*
  The components an .mdx page can use without importing them. A page is
  content, so it should not carry a list of imports before its first sentence.
*/
const components = { Example, Member, Arguments, Argument, Hint };

function DocsMdx({ children }) {
  return <MDXProvider components={components}>{children}</MDXProvider>;
}

export default DocsMdx;
