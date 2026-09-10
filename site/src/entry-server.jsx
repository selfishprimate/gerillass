import { renderToString } from "react-dom/server";
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from "react-router";

import { routes } from "./routes";

/*
  The build half: one function that turns a path into the HTML for that page.

  React Router's static handler runs the same route table the browser runs, so
  a page cannot be rendered here differently from the way it renders there --
  which is the failure a separate "static" copy of a site invites.

  In v7 these three come from `react-router` itself. In v6 they lived at
  `react-router-dom/server`, which is the subpath vite-react-ssg imported and
  the reason it cannot be used with v7 at all.
*/
export async function render(path) {
  const handler = createStaticHandler(routes);
  const context = await handler.query(new Request(`http://localhost${path}`));

  /*
    A Response here means a route answered with a redirect rather than an
    element -- /docs does exactly that. Those are handled in _redirects at the
    edge, so there is no file to write for them.
  */
  if (context instanceof Response) return null;

  const router = createStaticRouter(handler.dataRoutes, context);

  /*
    hydrate={false} because there is nothing to hydrate: no route has a loader,
    so every value on the page was compiled into it.

    Left on, the provider writes a <script> carrying that data as a sibling of
    the app inside #root. The browser's tree has no such node, so React finds a
    mismatch at the very top, gives up on hydrating and renders a second copy
    alongside the first -- which is exactly what it did: 44 code blocks on a
    page with 22, two .main-container elements, everything twice.
  */
  return renderToString(
    <StaticRouterProvider router={router} context={context} hydrate={false} />
  );
}

export { routes };
