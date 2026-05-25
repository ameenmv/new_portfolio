import saaf0 from "../../../assets/images/projects/saaf/image.png";
import saaf1 from "../../../assets/images/projects/saaf/image copy.png";
import saaf2 from "../../../assets/images/projects/saaf/image copy 2.png";
import saaf3 from "../../../assets/images/projects/saaf/image copy 3.png";

import type { ProjectContent } from "../../types";

export default {
  title: "SAAF",
  theme: "dark",
  tags: ["vue", "pinia", "i18n", "chartjs", "bootstrap", "sass", "pusher", "axios"],
  videoBorder: false,
  description:
    "SAAF is a fintech investment platform designed to provide investors with seamless access to various fund categories like real estate and equity, ensuring compliance with Saudi regulations.<br/><br/>I developed the complete secure login flow and handled complex user permissions using Role-Based Access Control (RBAC). Additionally, I implemented real-time fund updates using Pusher and Laravel Echo, created interactive financial dashboards using Chart.js, and managed full localization (i18n).",
  components: [
    {
      type: "media",
      props: {
        type: "image",
        src: saaf0,
        alt: "SAAF Dashboard Overview",
        caption: "Dashboard Overview",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: saaf1,
        alt: "SAAF Fund Management",
        caption: "Fund Management",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: saaf2,
        alt: "SAAF Investment Analytics",
        caption: "Investment Analytics",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: saaf3,
        alt: "SAAF Investor Reports",
        caption: "Investor Reports",
      },
    },
  ],
} as const satisfies ProjectContent;
