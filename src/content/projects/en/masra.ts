import masraOrder from "../../../assets/images/projects/masra/order-details.webp";
import masraAdminHome from "../../../assets/images/projects/masra/admin-home.webp";
import masraCompanyOrders from "../../../assets/images/projects/masra/company-orders.webp";
import masraVehicle from "../../../assets/images/projects/masra/vehicle.webp";
import masraWaybill from "../../../assets/images/projects/masra/waybill.webp";
import masraServices from "../../../assets/images/projects/masra/services.webp";

import type { ProjectContent } from "../../types";

export default {
  title: "Masra",
  theme: "dark",
  tags: ["vue", "nuxt", "pinia", "tailwind", "laravel", "mysql", "pusher", "i18n"],
  videoBorder: false,
  live: "https://masra.app/",
  description:
    "Masra is a Saudi road-freight platform that connects shippers with transport companies and their carriers: orders are priced, assigned to a company, dispatched to a driver and tracked until delivery.<br/><br/>I led the redesign of the whole operations side: the admin dashboard and the transport-company portal (100+ Vue views), from order details with a live stage road, trips, drivers and vehicles to wallet, invoices, tickets, settings and role permissions, all in Arabic and English. I built the shared component kit behind it (searchable selects, date and time pickers, paginated tables, KPI cards, status pills, the Saudi plate and Riyal symbol), redesigned the shipper web app in Nuxt 3, and shipped backend features in Laravel: real-time order distribution among approved transporters, direct dispatch, employee sub-accounts, and the printed road waybill and purchase bill with signed QR verification.",
  components: [
    {
      type: "media",
      props: {
        type: "image",
        src: masraOrder,
        alt: "Masra admin order details with the order stage road",
        caption: "Order details — stage road, next action and status log",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: masraAdminHome,
        alt: "Masra admin home with KPIs, monthly profit and latest orders",
        caption: "Admin home — KPIs, monthly profit, items that need attention",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: masraCompanyOrders,
        alt: "Transport company orders list with Saudi plates and status pills",
        caption: "Transport company portal — orders with filters, plates and status",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: masraWaybill,
        alt: "Printable road waybill with a QR code and milestones",
        caption: "Road waybill (بوليصة شحن) — printed from the browser, QR-verified",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: masraVehicle,
        alt: "Vehicle profile with driver, documents and trip history",
        caption: "Vehicle profile — driver, document validity and trips",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: masraServices,
        alt: "Services editor with Arabic, English and Urdu fields",
        caption: "Content editor — Arabic, English and Urdu",
      },
    },
  ],
} as const satisfies ProjectContent;
