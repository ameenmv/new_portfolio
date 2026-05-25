import smartlearn0 from "../../../assets/images/smartlearn/image.png";
import smartlearn1 from "../../../assets/images/smartlearn/image copy.png";
import smartlearn2 from "../../../assets/images/smartlearn/image copy 2.png";
import smartlearn3 from "../../../assets/images/smartlearn/image copy 3.png";

import type { ProjectContent } from "../../types";

export default {
  title: "Smart Learn",
  theme: "dark",
  tags: ["vue", "tailwind", "primevue", "pinia", "axios", "zod"],
  videoBorder: false,
  description:
    "Smart Learn is a comprehensive educational platform (Freelance project) developed using Vue 3 and PrimeVue.<br/><br/>Architected role-based dashboards tailored for instructors to seamlessly manage courses, upload lectures, and assign quizzes, alongside a dedicated student interface for tracking schedules, submitting assignments, and viewing certificates. Implemented robust state management with Pinia, secure authentication cycles, and complex form validations using Zod.",
  components: [
    {
      type: "media",
      props: {
        type: "image",
        src: smartlearn0,
        alt: "Smart Learn Landing Page",
        caption: "Landing Page",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: smartlearn1,
        alt: "Smart Learn Dashboard",
        caption: "Student Dashboard",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: smartlearn2,
        alt: "Smart Learn Courses",
        caption: "Course Management",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: smartlearn3,
        alt: "Smart Learn Interface",
        caption: "Platform Interface",
      },
    },
  ],
} as const satisfies ProjectContent;
