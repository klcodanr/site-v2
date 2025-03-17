/// <reference path="../.sst/platform/config.d.ts" />

import { smtpConfig } from "./secrets";

const logging = {
  retention: "1 week",
} as const;

export const api = new sst.aws.ApiGatewayV2("Api", {
  accessLog: {
    retention: "1 week",
  },
  cors: true,
  domain: $app.stage === "production" ? "api2.danklco.com" : undefined,
});
api.route("GET /health", {
  handler: "packages/functions/src/health.handler",
  link: [smtpConfig],
  logging,
});
api.route("POST /contact", {
  handler: "packages/functions/src/contact.handler",
  link: [smtpConfig],
  logging,
});
api.route("$default", {
  handler: "packages/functions/src/default.handler",
  logging,
});
