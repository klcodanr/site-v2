import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import pagefind from "astro-pagefind";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import redirects from "./config/redirects.mjs";

export default defineConfig({
  site: "https://danklco.com",
  integrations: [
    mdx(),
    sitemap(),
    pagefind(),
    icon(),
    (await import("astro-compress")).default({
      SVG: false,
    }),
  ],
  redirects,
  output: "static",

  markdown: {
    shikiConfig: {
      theme: "github-dark-high-contrast",
      transformers: [
        {
          pre: (node) => {
            delete node.properties.tabindex;
          },
        },
      ],
    },
  },
});
