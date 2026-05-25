import hazeclue0 from "../../../assets/images/hazeclue/image.png";
import hazeclue1 from "../../../assets/images/hazeclue/image copy.png";
import hazeclue2 from "../../../assets/images/hazeclue/image copy 2.png";
import hazeclue3 from "../../../assets/images/hazeclue/image copy 3.png";
import hazeclue4 from "../../../assets/images/hazeclue/image copy 4.png";

import type { ProjectContent } from "../../types";

export default {
  title: "Haze Clue",
  theme: "dark",
  tags: ["nuxt", "nestjs", "mongodb", "socketio", "tailwind", "pinia", "chartjs", "i18n"],
  videoBorder: false,
  description:
    "Haze Clue is a full-stack, real-time EEG attention monitoring platform (Graduation Project) that allows instructors to track students' cognitive levels through connected BCI devices.<br/><br/>Architected a scalable backend using NestJS and MongoDB with secure JWT/OTP authentication. Built a responsive, bilingual (RTL/LTR) frontend using Nuxt 4 and Tailwind CSS, and implemented seamless real-time data broadcasting and interactive analytics dashboards using WebSockets and Chart.js.",
  components: [
    {
      type: "media",
      props: {
        type: "image",
        src: hazeclue0,
        alt: "Haze Clue Landing Page",
        caption: "Landing Page",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: hazeclue1,
        alt: "Haze Clue Dashboard",
        caption: "Monitoring Dashboard",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: hazeclue2,
        alt: "Haze Clue Analytics",
        caption: "Analytics View",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: hazeclue3,
        alt: "Haze Clue Session",
        caption: "Live Session",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: hazeclue4,
        alt: "Haze Clue EEG Data",
        caption: "EEG Data View",
      },
    },
  ],
} as const satisfies ProjectContent;
