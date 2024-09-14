import type { SSTConfig } from "sst";
import FrontEnd from "./stacks/frontend";

export default {
  config(input) {
    return {
      name: "danklco",
      region: "us-east-2",
      profile: "danklco",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  stacks(app) {
    app.stack(FrontEnd);
  },
} satisfies SSTConfig;
