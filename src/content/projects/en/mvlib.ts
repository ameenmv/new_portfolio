import mvlib0 from "../../../assets/images/projects/mvlib/mvlib-0.png";

import type { ProjectContent } from "../../types";

export default {
  title: "MVLib",
  theme: "dark",
  tags: ["vue", "tailwind", "laravel", "pinia", "axios"],
  videoBorder: false,
  source: "https://github.com/ameenmv/MVLibrary",
  description:
    "MVLib is a complete online library management system designed to handle books and student operations seamlessly.<br/><br/>Built as the final project during the ITI internship, it provides a powerful admin dashboard and a flexible student module to simplify the borrowing and returning process. The UI/UX was fully designed from scratch.",
  components: [
    {
      type: "media",
      props: {
        type: "image",
        src: mvlib0,
        alt: "MVLib Library Management System",
        caption: "Library Dashboard",
      },
    },
  ],
} as const satisfies ProjectContent;
