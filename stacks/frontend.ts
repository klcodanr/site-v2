import { Api, AstroSite, Config, Function, StackContext } from "sst/constructs";

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
    customDomain:
      stack.stage === "production" ? "api.danklco.com" : undefined,
  });

  // Create the Astro site
  const site = new AstroSite(stack, "Site", {
    path: "packages/frontend/",
    bind: [api],
    environment: {
      PUBLIC_API_URL: api.url,
    },
    customDomain:
      stack.stage === "production"
        ? {
            domainName: "danklco.com",
            domainAlias: "www.danklco.com",
          }
        : undefined,
  });

  // Add the site's URL to stack output
  stack.addOutputs({
    SITE_URL: site.url,
    API_URL: api.url,
  });
}
