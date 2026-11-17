import saaf4 from "../../../assets/images/projects/saaf/image copy 4.png";
import saaf5 from "../../../assets/images/projects/saaf/image copy 5.png";
import saaf6 from "../../../assets/images/projects/saaf/image copy 6.png";
import saaf7 from "../../../assets/images/projects/saaf/image copy 7.png";

import type { ProjectContent } from "../../types";

export default {
  title: "SAAF",
  theme: "dark",
  tags: ["vue", "nuxt", "pinia", "tailwind", "i18n", "chartjs", "pusher", "axios"],
  videoBorder: false,
  live: "https://saaf.com.sa",
  description:
    "SAAF is an enterprise fintech ecosystem for real estate and equity investment, regulated by the Saudi Capital Market Authority (CMA). I was the lead frontend engineer on all three of its frontends: the Superadmin dashboard, the investor web app and the marketing site.<br/><br/>The Superadmin dashboard (Vue 3) spans 950+ views and 1,000+ reusable components across 100+ modules, including funds, sukuk, stocks, wallets, KYC / AML compliance, accounting and real estate. It has a two-tier RBAC system that guards routes and individual UI elements, and Chart.js / ApexCharts analytics for investors, asset allocation and fund performance.<br/><br/>The investor web app (Nuxt 4) lets people invest in funds and markets, manage several wallets with deposits, transfers, withdrawals and transaction history, and complete the full KYC onboarding, with live ticket chat and notifications over Pusher and guided product tours. A WebSocket layer (Pusher / Laravel Echo) replaced HTTP polling, so orders and wallets update in under a second. The Nuxt marketing site ships with full SSR and near-perfect Core Web Vitals, and everything works in Arabic and English (RTL / LTR).",
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
