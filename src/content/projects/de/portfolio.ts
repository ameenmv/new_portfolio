import portfolio0 from "../../../assets/images/oldportfolio/image.png";
import portfolio1 from "../../../assets/images/oldportfolio/image copy.png";
import portfolio2 from "../../../assets/images/oldportfolio/image copy 2.png";
import portfolio3 from "../../../assets/images/oldportfolio/image copy 3.png";

import type { ProjectContent } from "../../types";

export default {
  title: "Personal Portfolio",
  theme: "dark",
  tags: ["vue", "tailwind", "gsap"],
  videoBorder: false,
  live: "https://ameenmv.netlify.app/",
  source: "https://github.com/ameenmv/portfolio",
  description:
    "Rebuilt my personal portfolio (v2) from scratch using Vue.js, Tailwind CSS, and GSAP.<br/><br/>Focused on improving usability, refining the design, and adding smooth animations for a more professional feel. A project that highlights my growth as a Frontend Developer and sets the stage for future iterations.",
  components: [
    {
      type: "media",
      props: {
        type: "image",
        src: portfolio0,
        alt: "Portfolio Landing",
        caption: "Landing Page",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: portfolio1,
        alt: "Portfolio Projects",
        caption: "Projects Section",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: portfolio2,
        alt: "Portfolio About",
        caption: "About Section",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: portfolio3,
        alt: "Portfolio Contact",
        caption: "Contact Section",
      },
    },
  ],
} as const satisfies ProjectContent;
