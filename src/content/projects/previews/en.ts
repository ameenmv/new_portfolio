import thumbnailExclusive from "../../../assets/thumbnails/exclusive.png";
import thumbnailMvlib from "../../../assets/thumbnails/mvlib.png";
import thumbnailMvlms from "../../../assets/thumbnails/mvlms.png";
import thumbnailHidaaya from "../../../assets/thumbnails/hidaaya.png";
import thumbnailKiiibs from "../../../assets/thumbnails/kiiibs.png";

import type { ProjectPreview } from "../../types";

export default [
  {
    title: "Exclusive",
    slug: "exclusive",
    thumbnail: thumbnailExclusive,
    description: "Full-Stack E-Commerce Platform",
  },
  {
    title: "MVLib",
    slug: "mvlib",
    thumbnail: thumbnailMvlib,
    description: "Library Management System",
  },
  {
    title: "MV LMS",
    slug: "mvlms",
    thumbnail: thumbnailMvlms,
    description: "Learning Management System",
  },
  {
    title: "Hidaaya",
    slug: "hidaaya",
    thumbnail: thumbnailHidaaya,
    description: "Responsive Islamic Website",
  },
  {
    title: "KIIIBS",
    slug: "kiiibs",
    thumbnail: thumbnailKiiibs,
    description: "Responsive Online Store",
  },
] as const satisfies ProjectPreview[];
