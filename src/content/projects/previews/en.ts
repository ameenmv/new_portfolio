import thumbnailSaaf from "../../../assets/thumbnails/saaf.png";
import thumbnailHazeclue from "../../../assets/thumbnails/hazeclue.png";
import thumbnailSmartlearn from "../../../assets/thumbnails/smartlearn.png";
import thumbnailNabeeh from "../../../assets/thumbnails/nabeeh.png";
import thumbnailPortfolio from "../../../assets/thumbnails/portfolio.png";

import type { ProjectPreview } from "../../types";

export default [
  {
    title: "SAAF",
    slug: "saaf",
    thumbnail: thumbnailSaaf,
    description: "Fintech Investment Platform",
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
    title: "Nabeeh",
    slug: "nabeeh",
    thumbnail: thumbnailNabeeh,
    description: "Real-time Gaming Platform",
  },
  {
    title: "Personal Portfolio",
    slug: "portfolio",
    thumbnail: thumbnailPortfolio,
    description: "Portfolio v2 with GSAP Animations",
  },
] as const satisfies ProjectPreview[];
