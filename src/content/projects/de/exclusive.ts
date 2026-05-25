import exclusive0 from "../../../assets/images/projects/exclusive/exclusive-0.png";

import type { ProjectContent } from "../../types";

export default {
  title: "Exclusive",
  theme: "dark",
  tags: ["vue", "tailwind", "laravel", "axios", "vuelidate", "gsap"],
  videoBorder: false,
  source: "https://github.com/ameenmv/store",
  description:
    "Exclusive is a complete e-commerce platform built from scratch to serve three types of users: User, Company, and Admin.<br/><br/>The project implements full CRUD operations for product management, with a role-based authentication system. The frontend was developed using Vue.js and Tailwind CSS with GSAP animations for a modern, engaging interface.",
  components: [
    {
      type: "media",
      props: {
        type: "image",
        src: exclusive0,
        alt: "Exclusive E-Commerce Platform",
        caption: "E-Commerce Dashboard",
      },
    },
  ],
} as const satisfies ProjectContent;
