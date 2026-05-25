import mvlms0 from "../../../assets/images/projects/mvlms/mvlms-0.png";

import type { ProjectContent } from "../../types";

export default {
  title: "MV LMS",
  theme: "dark",
  tags: ["vue", "tailwind", "axios"],
  videoBorder: false,
  source: "https://github.com/ameenmv/mv-lms",
  description:
    "MV LMS is a fully frontend-based Learning Management System where the entire logic and UI was built using Vue.js.<br/><br/>The system enables Teachers to upload and manage lessons, Students to view available lessons, and Admins to manage lessons and users. This project highlights logic-building skills and ability to handle complex data flow on the frontend.",
  components: [
    {
      type: "media",
      props: {
        type: "image",
        src: mvlms0,
        alt: "MV LMS Learning Management System",
        caption: "Learning Platform",
      },
    },
  ],
} as const satisfies ProjectContent;
