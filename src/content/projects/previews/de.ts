import thumbnailSaaf from "../../../assets/thumbnails/saaf.png";
import thumbnailHazeclue from "../../../assets/thumbnails/hazeclue.png";
import thumbnailSmartlearn from "../../../assets/thumbnails/smartlearn.png";
import thumbnailSerag from "../../../assets/thumbnails/serag.webp";
import thumbnailMasra from "../../../assets/thumbnails/masra.webp";
import thumbnailPortfolio from "../../../assets/thumbnails/portfolio.png";

import type { ProjectPreview } from "../../types";

export default [
  {
    title: "Mohamed Serag",
    slug: "serag",
    thumbnail: thumbnailSerag,
    description: "Full-Stack E-commerce Store",
  },
  {
    title: "SAAF",
    slug: "saaf",
    thumbnail: thumbnailSaaf,
    description: "Fintech Investment Platform",
  },
  {
    title: "Masra",
    slug: "masra",
    thumbnail: thumbnailMasra,
    description: "Saudi Freight & Logistics Platform",
  },
  {
    title: "Haze Clue",
    slug: "hazeclue",
    thumbnail: thumbnailHazeclue,
    description: "Real-time EEG Monitoring Platform",
  },
  {
    title: "Smart Learn",
    slug: "smartlearn",
    thumbnail: thumbnailSmartlearn,
    description: "Educational Platform (Freelance)",
  },
  {
    title: "Personal Portfolio",
    slug: "portfolio",
    thumbnail: thumbnailPortfolio,
    description: "Immersive 3D Portfolio with Three.js & GSAP",
  },
] as const satisfies ProjectPreview[];
