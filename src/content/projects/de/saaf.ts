import saaf4 from "../../../assets/images/projects/saaf/image copy 4.png";
import saaf5 from "../../../assets/images/projects/saaf/image copy 5.png";
import saaf6 from "../../../assets/images/projects/saaf/image copy 6.png";
import saaf7 from "../../../assets/images/projects/saaf/image copy 7.png";

import type { ProjectContent } from "../../types";

export default {
  title: "SAAF",
  theme: "dark",
  tags: ["vue", "pinia", "i18n", "chartjs", "bootstrap", "sass", "pusher", "axios"],
  videoBorder: false,
  live: "https://saaf.com.sa",
  description:
    "SAAF is an enterprise fintech ecosystem delivering 840+ unique views and 1,180+ reusable UI components for real estate & equity investment — fully compliant with Saudi regulations.<br/><br/>Architected a granular two-tier Role-Based Access Control (RBAC) system for the Superadmin Dashboard, securing complex routing and element-level rendering to protect sensitive financial operations. Eliminated expensive HTTP polling by integrating Pusher/Laravel Echo via a custom Vue composable, establishing a persistent WebSocket layer for sub-second reactivity on live orders and wallets.<br/><br/>Built interactive financial dashboards with Chart.js for investor analytics, asset allocation, and fund management. Managed full localization (i18n) with RTL/LTR support and optimized the marketing landing page for near-perfect Core Web Vitals using SSR.",
  components: [
    {
      type: "media",
      props: {
        type: "image",
        src: saaf4,
        alt: "SAAF Superadmin Dashboard Overview",
        caption: "Superadmin Dashboard — Stats, Investors & Asset Allocation",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: saaf7,
        alt: "SAAF Fund Management",
        caption: "Fund Management — Create, Filter & Track Funds",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: saaf5,
        alt: "SAAF Wallet Transactions",
        caption: "Wallet Transactions — Transfers, Status & Amounts",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: saaf6,
        alt: "SAAF KYC Pages Management",
        caption: "KYC Pages — Investor & Company Compliance",
      },
    },
  ],
} as const satisfies ProjectContent;
