import hidaaya0 from "../../../assets/images/projects/hidaaya/hidaaya-0.png";

import type { ProjectContent } from "../../types";

export default {
  title: "Hidaaya",
  theme: "light",
  tags: ["html", "css", "javascript"],
  videoBorder: false,
  live: "https://ameenmv.github.io/Hidaaya/",
  source: "https://github.com/ameenmv/Hidaaya",
  description:
    "Hidaaya is a responsive Islamic website that serves as a guide to prayer times, the Quran, and supplications.<br/><br/>The entire UI/UX was designed from scratch, taking inspiration from Islamic websites while crafting a unique look and feel. Built completely with HTML, CSS, and JavaScript, focusing on clean design and smooth interactions.",
  components: [
    {
      type: "media",
      props: {
        type: "image",
        src: hidaaya0,
        alt: "Hidaaya Islamic Website",
        caption: "Islamic Guide",
      },
    },
  ],
} as const satisfies ProjectContent;
