/* tslint:disable */
/* eslint-disable */
import "sst";
declare module "sst" {
  export interface Resource {
    Astro: {
      type: "sst.aws.Astro";
      url: string;
    };
  }
}
export {};
