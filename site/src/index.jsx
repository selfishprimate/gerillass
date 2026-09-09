import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./routes";

/*
  Static generation. Each route is rendered at build time and written out as a
  real HTML file, rather than the browser building the page from an empty
  <div id="root">.

  It matters most for the documentation that will mount under /docs: every page
  carries its own title, description and preview image, and the scrapers behind
  a link shared to Slack or X do not run JavaScript. A client-rendered page
  hands them 46 characters of "You need to enable JavaScript to run this app."
*/
export const createRoot = ViteReactSSG({ routes });
