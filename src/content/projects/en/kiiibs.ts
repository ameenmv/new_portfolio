import kiiibs0 from "../../../assets/images/projects/kiiibs/kiiibs-0.png";

import type { ProjectContent } from "../../types";

export default {
  title: "KIIIBS",
  theme: "dark",
  tags: ["vue", "pinia", "vuelidate"],
  videoBorder: false,
  live: "https://kiiibs.netlify.app/",
  source: "https://github.com/ameenmv/kiiibs",
  description:
    "KIIIBS is a responsive e-commerce website developed completely from scratch without using any external design libraries.<br/><br/>The project simulates a real online store with cart functionality, form validation, and responsive design, all powered by Vue.js. Built entirely independently while handling every detail of the UI and system logic.",
  components: [
    {
      type: "media",
      props: {
        type: "image",
        src: kiiibs0,
        alt: "KIIIBS Online Store",
        caption: "E-Commerce Store",
      },
    },
  ],
} as const satisfies ProjectContent;
