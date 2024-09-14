import { test, expect } from "@playwright/test";
import type { Page } from "playwright";
import { readFileSync } from "fs";
import { XMLParser } from "fast-xml-parser";
import AxeBuilder from "@axe-core/playwright"; // 1

async function expectPageValid(page: Page, url: string) {
  await page.goto(url);

  await expect(page).toHaveTitle(/.*\| DanKlco.com/);

  const header = page.getByRole("banner");
  expect(header).toBeTruthy();

  const mainHeader = header.getByRole("heading", { name: "Dan Klco" });
  await expect(mainHeader).toBeVisible();

  const topNav = header.getByRole("navigation");
  await expect(topNav).toBeVisible();

  await Promise.all(
    ["Posts", "Work", "CV", "Projects", "Contact"].map(async (name) => {
      const navLink = topNav.getByRole("link", { name });
      await expect(navLink).toBeVisible();
    })
  );

  const main = page.getByRole("main");
  await expect(main).toBeVisible();

  const footer = page.getByRole("contentinfo");
  await expect(footer).toBeVisible();

  // TODO Re-enable once accessability issues are fixed
  // if (!url.startsWith("/posts")) {
  //   const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

  //   expect(accessibilityScanResults.violations).toEqual([]);
  // }
}

const sitemapXml = readFileSync("dist/sitemap-0.xml", "utf-8");
const parser = new XMLParser();
const sitemap = parser.parse(sitemapXml);

const urls: string[] = sitemap.urlset.url.map((url: { loc: string }) =>
  url.loc.replace("https://danklco.com", "")
);

urls.forEach((url) => {
  test(`page ${url} is valid`, async ({ page }) => {
    await expectPageValid(page, url);
  });
});
