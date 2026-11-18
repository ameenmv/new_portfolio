import seragHome from "../../../assets/images/projects/serag/store-home.webp";
import seragNextStep from "../../../assets/images/projects/serag/store-order-next-step.webp";
import seragMobile from "../../../assets/images/projects/serag/mobile.webp";
import seragAccount from "../../../assets/images/projects/serag/store-account.webp";
import seragAdminOverview from "../../../assets/images/projects/serag/admin-overview.webp";
import seragAdminOrder from "../../../assets/images/projects/serag/admin-order.webp";
import seragSiteEditor from "../../../assets/images/projects/serag/admin-site-editor.webp";
import seragReports from "../../../assets/images/projects/serag/admin-reports.webp";

import type { ProjectContent } from "../../types";

export default {
  title: "Mohamed Serag",
  theme: "dark",
  tags: ["nuxt", "vue", "nestjs", "postgresql", "prisma", "tailwind", "shadcn", "zod", "three", "gsap", "docker"],
  videoBorder: false,
  live: "https://mserag.com/",
  description:
    "An Arabic-first online store and admin dashboard for Mohamed Serag, a family-run home-appliance showroom in Mansoura since 1972. I built it solo, end to end: a Turborepo monorepo with a Nuxt 4 SSR storefront, a NestJS API on PostgreSQL / Prisma, and Zod schemas shared by both. 280+ commits, 28 specced features and 860+ automated tests.<br/><br/>Checkout follows how Egyptians actually buy: guest checkout, cash on delivery, InstaPay and Vodafone Cash. The customer transfers only the shipping fee (or a deposit) up front, and the owner confirms it with one tap from a signed link sent over WhatsApp. Search understands Arabic spelling variants and Arabic-Indic digits, the home page tells a 3D product story with Three.js and GSAP, and the admin side covers orders, payments, stock, a site editor with drafts and version history, and reports. Live at mserag.com.",
  components: [
    {
      type: "media",
      props: {
        type: "image",
        src: seragHome,
        alt: "Mohamed Serag storefront home page",
        caption: "Storefront — home",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: seragNextStep,
        alt: "Thank-you page asking for the shipping-fee transfer",
        caption: "After checkout — one step left: transfer the shipping fee",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: seragMobile,
        alt: "Store on a phone: home, sign up and next step",
        caption: "On a phone — home, sign up, next step",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: seragAccount,
        alt: "Customer account page with order history",
        caption: "Customer account — orders and live status",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: seragAdminOverview,
        alt: "Admin dashboard overview",
        caption: "Admin — overview",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: seragAdminOrder,
        alt: "Admin order detail",
        caption: "Admin — order detail and payment confirmation",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: seragSiteEditor,
        alt: "Admin site editor for the home page",
        caption: "Site editor — draft, preview, publish, version history",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: seragReports,
        alt: "Admin reports with charts",
        caption: "Reports — charts and CSV export",
      },
    },
  ],
} as const satisfies ProjectContent;
