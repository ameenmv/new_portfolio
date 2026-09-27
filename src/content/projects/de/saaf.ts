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
    "SAAF is an enterprise fintech ecosystem for real estate & equity investment, fully compliant with Saudi CMA regulations. The Superadmin Dashboard alone spans 879 views, 1,009 reusable components, 774 composables, and 128 API modules across 96+ feature modules — including Investor Management, Fund Management, Wallets, KYC/AML Compliance, Sukuk, Stocks, DPM, and Real Estate.<br/><br/>Engineered a granular two-tier RBAC system securing complex routing and element-level rendering for sensitive financial operations. Built real-time reactivity with Pusher/Laravel Echo WebSockets for live order tracking and wallet updates. Designed interactive analytics dashboards with Chart.js for investor stats, asset allocation, and fund performance. Full bilingual i18n with RTL/LTR support across every module.",
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
