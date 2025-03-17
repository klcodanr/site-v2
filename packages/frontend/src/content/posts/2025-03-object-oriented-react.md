---
title: When Object-Oriented Development Meets React
description: Object oriented programming in React is fine, but model / data objects must be separate from their mutator.
hideInNav: false
tags:
  - React
  - Object Oriented
  - NodeJs
pubDate: 2025-03-17
display: post
published: true
image: /images/posts/2025-03/uriel-soberanes-L1bAGEWYCtk-unsplash.jpg
---

One of the common issues I have observed with experienced backend developers working in React is miss-applying object oriented principles to React. While object oriented programming has place in React development, especially in writing more complex client and state management code, miss-applying object oriented principles can result in very complex state management and unnecessary renders.

## The Problem 

When developing in React, especially using type script, you have access to a class system similar and in some ways even more capable than the class system in Java. TypeScript classes and types can be used quite effectively to contain related properties in a single object or tree of objects.

For example, I may write a REST client for talking to my backend as a class because I want the client to maintain the credentials internally and consistently instrument all of my request like the example below.


```typescript
export type MyObject = {
    readonly id: string;
    readonly name: string;
}

export class MyClient {
    private bearer: string:
    
    constructor(bearer: string) {
        this.bearer = bearer;
    }

    private async doFetch(path: string, init: RequestInit) {
        const res = await fetch(`https://api.myservice.com${path}`, init);
        if (!res.ok) {
        throw new Error(`Failed to make api call: ${res.status}`);
        }
        return res.json()
    }

    async getObject(id: string): MyObject {
        return this.doFetch(`/objects/${id}`);
    }

    updateObject(obj: MyObject) {
        return this.doFetch(`/objects/${obj.id}`, {method: "PUT", body: JSON.stringify(obj)});
    }
}
```

However, practitioners of object oriented programming may also be tempted to mix, in MVC terms, models and controllers. If in this example, my draft client instead returned an object that allowed me to mutate the draft then I am making managing state more complex:

```typescript
export class MyObject {
  readonly id: string;
  private name: string;
  private client: MyClient:

  constructor(client, id, name) {
    this.client = client;
    this.id = id;
    this.name = name;
  }

  get name(): string {
    return this.name;
  }

  async updateName(name: string) {
    this.name = name;
    await this.client.doFetch(`/objects/${this.id}`, {method: “PATCH”, body: JSON.stringify({op: “replace”, path: “/name”, value: this.name})});
  }
} 

export class MyClient {
  private bearer: string:
  
  constructor(bearer: string) {
    this.bearer = bearer;
  }

  async doFetch(path: string, init: RequestInit) {
    const res = await fetch(`https://api.myservice.com${path}`, init);
    if (!res.ok) {
      throw new Error(`Failed to make api call: ${res.status}`);
    }
    return res.json()
  }

  async getObject(id: string): MyObject {
    return this.doFetch(‘/objects/${id}’);
  }
}
```

## Why this is a problem

Reacts rendering is a common stumbling block in React development as it’s not always intuitive when a component will re-render. The decision of whether or not a component will re-render is based on comparing dependencies using reference equality. As programmers we tend to think in terms of value equality, e.g., the two objects are “the same” if the contents of the object are equal, however, in react, rendering is based on the dependencies for a component or hook being the exact same using `Object.is`. 

When you mingle state full and not state full properties and methods within a single object you now need to expect that the component will re-render when the state of the object changes, even if the non-state full properties have not been updated.

Separating the model from the mutation functions allows the mutator to be stateless, eliminating the need to re-render any component only using the mutator. Furthermore if we make the model effectively or by type definition immutable, managing state is even easier as reference equality is sufficient to determine if the object has been updated and the component needs to re-render.

## tl;dr;

Object oriented programming in React is fine, but model / data objects must be separate from their mutator.