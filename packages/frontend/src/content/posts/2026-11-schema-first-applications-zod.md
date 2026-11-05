---
title: "Schema-First Applications with Zod"
description: "See how Zod schemas can define types, enforce consistent validation across trust boundaries and generate OpenAPI contracts"
pubDate: 2026-11-05
tags: 
 - TypeScript
 - Zod
 - API Design
 - Development
 - Architecture
display: post
published: true
image: "/images/posts/2026-11/lukas-hron-Gz5eVQzkNrs-unsplash.jpg"
hideInNav: false
---


One of the inevitable challenges when developing applications and APIs is validating data at trust boundaries. Every application has trust boundaries: points where data crosses between components that evolve independently. The obvious use cases are requests and responses, but data should also be validated whenever it crosses an application boundary, including when it is read from or written to persistence.

This is where [Zod](https://zod.dev/) comes in. Zod is a TypeScript-first library for creating schemas. With Zod, you can define a schema, then use the schema to validate objects and infer TypeScript types. Thus, the Zod schema becomes the source of truth for the data model shared across the entire application.

For a concrete example, we will look at [Roku Manager](https://github.com/klcodanr/roku-manager), a self-hosted application that I created to help set, manage and audit the usage for Roku apps in my household.

## Creating a Common Schema with Zod

Schema-first development starts by defining the application’s data structures as Zod schemas. Generally, this should be in a common package so that backend service and web application can use the same schemas. Roku Manager keeps those definitions in a separate `@roku-manager/core` package in the [PNPM](https://pnpm.io/) monorepo.

The device settings model is a good example. A user can turn enforcement on or off, and those two states have different requirements. When enforcement is enabled, at least one rule is required; when it is disabled, an empty rule list is the default:

```typescript
export const deviceSettingsSchema = z.discriminatedUnion("enforcementEnabled", [
  z.object({
    deviceId: z.string(),
    enforcementEnabled: z.literal(true),
    rules: z.array(deviceRuleSchema).min(1),
  }),
  z.object({
    deviceId: z.string(),
    enforcementEnabled: z.literal(false),
    rules: z.array(deviceRuleSchema).default([]),
  }),
]);
```

The rule schema composes smaller constraints as well. In this example, a rule has a non-empty name, valid days of the week, a time range, and a maximum number of minutes. You can even implement complex conditional logic, its `limitBehavior` is a discriminated union: a cooldown requires `cooldownMinutes`, while a rest-of-day limit does not.

```typescript
export const deviceRuleSchema = z
  .object({
    name: z.string().min(1),
    days: z.array(z.number().min(0).max(6)).min(1).max(7),
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
    maxMinutes: z.number().min(1).max(24 * 60),
  })
  .and(
    z.union([
      z.object({
        limitBehavior: z.literal("cooldown"),
        cooldownMinutes: z.number().min(1).max(24 * 60),
      }),
      z.object({ limitBehavior: z.literal("rest_of_day") }),
    ]),
  );
```

The schema describes both the shape and the rules for validating the data. A plain TypeScript type could tell us that `rules` is an array, but it could not reject a rule with day `7` or a cooldown with no cooldown duration at runtime. With Zod both the shape and validation are enforced in one schema object, reducing the amount of boilerplate code.

Zod can derive a TypeScript type from the schemas:

```typescript
import { type z } from "zod";

export type DeviceSettings = z.infer<
  typeof import("./schemas").deviceSettingsSchema
>;
```

Since the type module do not import the schema directly, using the types will not directly cause the schemas and Zod itself to be bundled during build.

## Persistence with Schemas

Persisted data is the first boundary your application will encounter. As persisted data could be missing, invalid, or otherwise not in the expected format, enforcing persisted validity on read with Zod makes it easier to find and fix invalid persisted data.

Our example, Roku Manager uses simple local files rather than a database as it's a small, self-hosted application, however the same approach applies to a database or object storage backed application: the persistence wrapper should validate data as it enters and leaves the storage layer.

Often, the persisted shape will augment the domain entity shapes for storing persistence-specific metadata. To avoid leaking persistence data into the domain entity schema, you can define a storage specific schema that extends the domain entity schema.

In our example, multiple domain entities are stored in a single JSON file and the storage library defines a private schema for the complete persisted state by composing the domain schemas:

```typescript
const stateSchema = z.object({
  settings: z.record(z.string(), deviceSettingsSchema),
  sessions: z.record(z.string(), enforcementSessionSchema),
  devices: z.record(z.string(), knownDeviceSchema),
});

type State = z.infer<typeof stateSchema>;
```

When the service starts, it parses and validates the JSON document. Invalid or stale data fails at the storage boundary instead of producing mysterious errors later in a request handler:

```typescript
const content = await readFile(this.filePath, "utf8");
this.state = stateSchema.parse({
  ...emptyState(),
  ...JSON.parse(content),
});
```

The write operation should also be schema-aware. The codec gives the application a Date in memory while defining an explicit ISO date-time string when serializing:

```typescript
// store.ts
await writeFile(
  temporaryPath,
  JSON.stringify(stateSchema.encode(this.state), null, 2),
);
await rename(temporaryPath, this.filePath);

// schemas.ts
export const isoDatetimeToDate = z.codec(z.iso.datetime(), z.date(), {
  decode: (isoString) => new Date(isoString),
  encode: (date) => date.toISOString(),
});
export const enforcementSessionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lockedUntil: z.coerce.date().nullable(),
  usedSeconds: z.number(),
  lastActiveAt: isoDatetimeToDate.nullable(),
  lastObservedAt: isoDatetimeToDate.nullable(),
  enforcementFailed: z.boolean(),
  enforcementError: z.string().nullable(),
});
```

## Schemas in the API

Once the domain and persistence layers use schemas, the API can use those same definitions to derive [OpenAPI](https://www.openapis.org/) definitions. Most common node frameworks have support for this via plugins:

 - [Hono](https://hono.dev/): [@hono/zod-openapi](https://hono.dev/examples/zod-openapi)
 - [fastify](https://fastify.dev/): [fastify-zod-openapi](https://github.com/samchungy/fastify-zod-openapi)
 - [Express](https://expressjs.com/): [express-zod-api](https://www.npmjs.com/package/express-zod-api)

Roku Manager uses Hono with `@hono/zod-openapi`. Each API route is declared with `createRoute`, and the schemas describe the request, response, and metadata for the OpenAPI description.

For example, the settings endpoint uses `deviceSettingsSchema` for both the request body and the response as well as defining the parameters as an inline schema:

```typescript
createRoute({
  method: "put",
  path: "/api/devices/{deviceId}/settings",
  request: {
    params: z.object({ deviceId: z.string().min(1) }),
    body: {
      content: {
        "application/json": { schema: deviceSettingsSchema },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: deviceSettingsSchema },
      },
      description: "Updated settings",
    },
  },
});
```

This simplifies the handler code as the handler receives validated data through Hono’s route context rather than parsing the request again:

```typescript
const settings = c.req.valid("json");
const { deviceId } = c.req.valid("param");
if (deviceId !== settings.deviceId) {
  throw new ProblemDetailsError({
    status: 400,
    detail: "Device ID in the URL does not match the device ID in the request body",
  });
}
```

Since the shape of the request and response are defined by schema, TypeScript will enforce that the correct shapes are read from the request and sent in the response, allowing developers to identify issues quicker and easier.

## Using Types on the Frontend

It is one thing for the backend to use consistent types and schemas, but the shared package can extend that consistency into the frontend too. The frontend/web package can import the inferred types from `@roku-manager/core` when defining its API client:

```typescript
import type {
  CheckResult,
  DeviceSettings,
  EnforcementSession,
  RokuDevice,
} from "@roku-manager/core";

export type SessionResponse = {
  session: EnforcementSession;
  status: CheckResult;
};

export const getSettings = (id: string) =>
  request<DeviceSettings>(
    `/api/devices/${encodeURIComponent(id)}/settings`,
  );
```

This gives the frontend compile-time alignment with the API without duplicating types or bundling the schema / validation code at runtime.

There is an important caveat: generated types do not validate JSON. If the frontend is not in the trust boundary of the backend, validate user input before passing it to the backend or use the schema to generate forms, it will need the schemas package to be a runtime dependency and import the schemas as well as the types.

## Check Out the Example App

The complete example is available in [Roku Manager on GitHub](https://github.com/klcodanr/roku-manager).

## Related Questions

### Will Zod Bloat my Bundle?

It can, but it doesn't have to. As shown in the example, if the server and client are coupled and in the same trust boundary, you can get the compile time type safety of Zod types when developing while the types are erased transpile time and therefore don't have an impact on the bundled code size.

If you are using the schemas on the client side, either due to there needing to be a trust boundary between the client and server or to validate input from other sources, keep server-only schemas out of frontend entry points and use static, type-only imports when runtime validation is not needed. Modern bundlers can then remove unused modules through tree shaking. In addition, you _can_ leverage [zod/mini](https://zod.dev/packages/mini) which has been demonstrated to have a 64% reduction in bundle size, but [even the Zod team](https://zod.dev/packages/mini?id=when-not-to-use-zod-mini#when-not-to-use-zod-mini) is somewhat mixed on if this is an effective optimization, especially given that Zod is not a large library and `zod/mini` uses different types and has a less friendly syntax than "regular" Zod.

### Why use Zod instead of TypeScript interfaces alone?

 1. TypeScript interfaces describe values during development, but they are erased when the code is transpiled. Zod schemas are executed even after transpilation.
 2. TypeScript types cannot validate that JSON / Objects actually meet the expected shape, they just declare the shape
 3. Zod schemas can be used to validate the validity of fields with non-type rules, for example enforcing minimums or maximums or that a string is a URL

Zod can do all of the above _AND_ create types, Zod is significantly superior to just TypeScript types alone.

### Should the frontend validate API responses at runtime?

It depends on the trust boundary and the consequences of invalid data. In our example, the frontend defines the core package as a devDependency and imports inferred types with `import type`, which keeps the client lightweight but only provides compile-time checking.

If the frontend is deployed independently or talks to multiple backend versions, it should parse responses before using them:

```typescript
import { settingsSchema } from "@my-app/core/schemas/settings";

const response = await request<unknown>(path);
const settings = settingsSchema.parse(response);
```

### Do I need one schema to rule them all?

Just as One does not simply walk into Mordor, one should not try to shove every use case into a single schema. For simple use cases this _may_ be fine, but for many use cases an object's shape may change subtly or drastically throughout its lifecycle.

Using Zod's composition and filtering methods though you can _usually_ use a core representation of the entity as a base for the usecase specific schemas.

Let's consider an example User object that is stored in DynamoDB and accessed via a REST API:

```typescript
export const userSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  email: z.email(),
  role: z.enum(['admin', 'user']),
  lastLogin: isoDatetimeToDate.nullable(),
  locked: z.boolean(),
});
```

To store the object in DynamoDB I'll add a field `type='user'` and primary key, materialized as `${type}/${user.id}`, so my persistenceSchema could look like:

```typescript
export const userPersistenceSchema = userSchema.extend({
    key: z.string().min(1),
    type: z.enum(['user', 'someothertype']),
});
```

Now I'll also need to have models to support creating and updating the user, but of course we should not expose _every_ field becuase clients must not be able to modify authorization fields or unlock themselves.

```typescript
// Assuming this is a PATCH of partial data
export const userUpdateSchema = userSchema.pick({
  name: true,
  email: true,
}).partial();

// Create requires name _and_ email as it is not partial
export const userCreateSchema = userSchema.pick({
  name: true,
  email: true,
});
```

Photo by [Lukas Hron](https://unsplash.com/@lukashron?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/photos/an-electrical-device-laying-on-top-of-a-blueprint-Gz5eVQzkNrs?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText)
