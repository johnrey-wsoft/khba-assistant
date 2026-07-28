import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "NextBase",
  description: "Production-ready full-stack starter with Next.js 16, Supabase, and Drizzle ORM",
  ignoreDeadLinks: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Docs", link: "/overview" },
      { text: "Demo", link: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/" },
    ],

    sidebar: [
      {
        text: "Getting Started",
        items: [
          { text: "Overview", link: "/overview" },
          { text: "Local Development", link: "/overview#local-development-offline" },
        ],
      },
      {
        text: "Patterns",
        items: [
          { text: "Pattern Guide", link: "/patterns/" },
          { text: "API Response", link: "/patterns/api-response" },
          { text: "Auth Guard", link: "/patterns/auth-guard" },
          { text: "Form Validation", link: "/patterns/form-validation" },
          { text: "Route Definitions", link: "/patterns/routes" },
          { text: "Query Keys", link: "/patterns/query-keys" },
          { text: "HTTP Status", link: "/patterns/http-status" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/wannacry081/Nextjs-Supabase-Template" },
    ],
  },
});
