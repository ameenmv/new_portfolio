export type TagVariant =
  | "vue"
  | "nuxt"
  | "tailwind"
  | "laravel"
  | "pinia"
  | "gsap"
  | "three"
  | "react"
  | "node"
  | "html"
  | "css"
  | "javascript"
  | "typescript"
  | "bootstrap"
  | "php"
  | "mysql"
  | "vuelidate"
  | "axios";

export const tagLabels = {
  vue: "Vue.js",
  nuxt: "Nuxt.js",
  tailwind: "Tailwind CSS",
  laravel: "Laravel",
  pinia: "Pinia",
  gsap: "GSAP",
  three: "Three.js",
  react: "React",
  node: "Node.js",
  html: "HTML",
  css: "CSS",
  javascript: "JavaScript",
  typescript: "TypeScript",
  bootstrap: "Bootstrap",
  php: "PHP",
  mysql: "MySQL",
  vuelidate: "Vuelidate",
  axios: "Axios",
} as const satisfies Record<TagVariant, string>;
