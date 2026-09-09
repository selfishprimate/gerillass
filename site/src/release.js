/*
  The Gerillass release the site advertises. Everything that mentions the
  version — the header badge and both download buttons — reads it from here.

  It is the version of the library in this repository, not a number typed in:
  the badge sat two releases behind twice because a bump meant remembering to
  edit this file as well as `package.json`. It used to read the installed
  copy, which still meant an install after every release; now the library is
  upstairs, so bumping its version is the whole job and the site cannot claim
  a release it was not built against.

  Refresh the stargazer snapshot in the same pass:
  node scripts/update-supporters.js
*/
import { version } from "../../package.json";

export const VERSION = version;

export const DOWNLOAD_URL = `https://github.com/selfishprimate/gerillass/archive/refs/tags/v${VERSION}.zip`;
