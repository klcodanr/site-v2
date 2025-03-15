/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "thecaringplace-info",
      home: "aws",
      removal: input?.stage === "production" ? "retain" : "remove",
      providers: {
        aws: {
          // profile: "thecaringplace",
          region: "us-east-2",
        }
      }
    };
  },

  async run() {
    const {api} = await import("./infra/api");
    const {site} = await import("./infra/frontend");
    return {
      site: site.url,
      api: api.url,
    };
  },
});
