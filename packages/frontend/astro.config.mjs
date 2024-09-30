import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import pagefind from "astro-pagefind";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";

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
