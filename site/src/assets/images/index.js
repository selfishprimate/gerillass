/*
  create-react-app resolved these with require(), which webpack understood and
  a browser does not. Static imports are the Vite equivalent and give the same
  hashed URLs, with the bonus that an image that goes missing now fails the
  build instead of at runtime.
*/

import img0 from "./files/hero_image_01.svg";
import img1 from "./files/hero_image_02.svg";
import img2 from "./files/hero_image_03.svg";
import img3 from "./files/cup.svg";
import img4 from "./files/empty.svg";
import img5 from "./files/growth.svg";
import img6 from "./files/idea.svg";
import img7 from "./files/library.svg";
import img8 from "./files/face_thinking.svg";
import img9 from "./files/face_whiskered.svg";
import img10 from "./files/face_smile.svg";
import img11 from "./files/bubble_examples.svg";

const images = {
  hero_image_01: img0,
  hero_image_02: img1,
  hero_image_03: img2,
  cup: img3,
  empty: img4,
  growth: img5,
  idea: img6,
  library: img7,
  face_thinking: img8,
  face_whiskered: img9,
  face_smile: img10,
  bubble_examples: img11,
};

export default images;
