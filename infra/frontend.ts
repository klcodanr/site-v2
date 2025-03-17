/// <reference path="../.sst/platform/config.d.ts" />;

import {api} from './api';

export const site = new sst.aws.StaticSite("Site", {
  dev: {
    command: "npm run dev",
    url: "http://localhost:4321",
  },
  path: "packages/frontend/",
  build: {
    command: "npm run build",
    output: "dist",
  },
  environment: {
    PUBLIC_API_URL: api.url,
  },
  errorPage: "404.html",
  domain:
    $app.stage === "prod"
      ? {
          name: "danklco.com",
          redirects: ["www.danklco.com"],
        }
      : undefined,
});
