import {
  Api,
  Config,
  Function,
  StackContext,
  StaticSite,
} from "sst/constructs";

export default function Site({ stack }: StackContext) {
  // define the secrets
  const SMTP_CONFIG = new Config.Secret(stack, "SMTP_CONFIG");

  const contactFn = new Function(stack, "ContactFn", {
    handler: "packages/functions/src/contact.handler",
    bind: [SMTP_CONFIG],
  });

  // define the API
  const api = new Api(stack, "Api", {
    routes: {
      "POST /contact": contactFn,
      $default: "packages/functions/src/default.handler",
    },
    accessLog: {
      retention: "one_week",
    },
    customDomain: stack.stage === "production" ? "api.danklco.com" : undefined,
  });

  // Create the Astro site
  const site = new StaticSite(stack, "Site", {
    path: "packages/frontend/",
    buildOutput: "dist",
    buildCommand: "npm run build",
    environment: {
      PUBLIC_API_URL: api.url,
    },
    errorPage: "404.html",
    customDomain:
      stack.stage === "production"
        ? {
            domainName: "danklco.com",
            domainAlias: "www.danklco.com",
          }
        : undefined,
    assets: {
      fileOptions: [
        {
          files: "**",
          cacheControl: "max-age=0,no-cache,no-store,must-revalidate",
        },
        {
          files: [
            "**/*.js",
            "**/*.css",
            "**/*.woff",
            "**/*.png",
            "**/*.jpg",
            "**/*.jpeg",
            "**/*.gif",
            "**/*.svg",
          ],
          cacheControl: "max-age=31536000,public,immutable",
        },
      ],
    },
  });

  // Add the site's URL to stack output
  stack.addOutputs({
    SITE_URL: site.url,
    API_URL: api.url,
  });
}
