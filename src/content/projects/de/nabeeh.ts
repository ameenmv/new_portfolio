import nabeeh0 from "../../../assets/images/nabeeh/image.png";
import nabeeh1 from "../../../assets/images/nabeeh/image copy.png";
import nabeeh2 from "../../../assets/images/nabeeh/image copy 2.png";
import nabeeh3 from "../../../assets/images/nabeeh/image copy 3.png";

import type { ProjectContent } from "../../types";

export default {
  title: "Nabeeh",
  theme: "dark",
  tags: ["nuxt", "nuxtui", "tailwind", "socketio"],
  videoBorder: false,
  description:
    "Nabeeh is a competitive gaming platform featuring real-time multiplayer functionality.<br/><br/>I implemented the core game logic using WebSockets (Socket.IO), enabling users to compete simultaneously in interactive sessions with live score updates. The project leverages Nuxt.js for optimal performance and handles complex state synchronization to ensure a lag-free experience between players.",
  components: [
    {
      type: "media",
      props: {
        type: "image",
        src: nabeeh0,
        alt: "Nabeeh Gaming Platform",
        caption: "Landing Page",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: nabeeh1,
        alt: "Nabeeh Game Interface",
        caption: "Game Interface",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: nabeeh2,
        alt: "Nabeeh Multiplayer",
        caption: "Multiplayer Session",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: nabeeh3,
        alt: "Nabeeh Leaderboard",
        caption: "Live Scores",
      },
    },
  ],
} as const satisfies ProjectContent;
