export const social = [
  { url: "mailto:ameeenmv@gmail.com", name: "mail" },
  { url: "https://github.com/ameenmv", name: "github" },
  { url: "https://www.linkedin.com/in/ameeenmv", name: "linkedin" },
  { url: "https://x.com/ameeen_mv", name: "x" },
  { url: "https://www.instagram.com/ameeen_mv", name: "instagram" },
] as const satisfies { url: string; name: "mail" | "github" | "instagram" | "linkedin" | "x" }[];
