import React from "react";
import { MDXProvider } from "@mdx-js/react";

import Example from "./Example";

/*
  The components an .mdx page can use without importing them. A page is
  content, so it should not carry a list of imports before its first sentence.
*/
const components = { Example };

function DocsMdx({ children }) {
  return <MDXProvider components={components}>{children}</MDXProvider>;
}

export default DocsMdx;
