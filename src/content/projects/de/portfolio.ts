import portfolio0 from "../../../assets/images/oldportfolio/image copy 4.png";
import portfolio1 from "../../../assets/images/oldportfolio/image copy 5.png";
import portfolio2 from "../../../assets/images/oldportfolio/image copy 6.png";

import type { ProjectContent } from "../../types";

export default {
  title: "Personal Portfolio",
  theme: "dark",
  tags: ["vue", "typescript", "gsap", "sass"],
  videoBorder: false,
  live: "https://www.ameeen.me/",
  source: "https://github.com/ameenmv/new_portfolio",
  description:
    "My personal portfolio (v3) — a fully immersive 3D experience built with Vue.js, Three.js, and GSAP. Features a custom 3D avatar in an interactive scene, scroll-driven animations with GSAP ScrollTrigger, a holographic about section with projected UI elements, and a cinematic contact reveal with SVG text path animation.<br/><br/>Designed and engineered every aspect from scratch: the 3D scene composition, the scroll-based camera transitions, the character rig interactions, and the responsive layout system with i18n support.",
  components: [
    {
      type: "media",
      props: {
        type: "image",
        src: portfolio0,
        alt: "Portfolio Hero — 3D Desk Scene",
        caption: "Hero — Interactive 3D Desk Scene with Avatar",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: portfolio1,
        alt: "Portfolio About — Holographic UI",
        caption: "About — Holographic Avatar with Projected UI",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: portfolio2,
        alt: "Portfolio Contact — Let's Work Together",
        caption: "Contact — Cinematic Reveal with Social Links",
      },
    },
  ],
} as const satisfies ProjectContent;
