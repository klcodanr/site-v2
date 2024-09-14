# DanKlco.com

This site is created with [Astro](https://astro.build/) and [SST](https://docs.sst.dev/).

## 🚀 Setup

This project requires:

 - [Node v20](https://nodejs.org/en/learn/getting-started/how-to-install-nodejs)
 - [AWS CLI](https://aws.amazon.com/cli/)
 - An AWS Account or an AWS Access Key

To get setup:

 - switch to Node 20 manually or via `nvm use`
 - update your `~/.aws/credentials` to have an AWS Access Key in the scope `danklco`
 - run `npm ci`

## 📁 Project Structure

- [packages/frontend](packages/frontend) - Website code and content
- [packages/functions](packages/functions/) - Serverless lambda functions
- [stacks](stacks/) - SST Stacks (currently only one)

## 🪄 Commands

All commands are run from the root of the project, from a terminal:

| Command                               | Action                                           |
| :------------------------------------ | :----------------------------------------------- |
| `npm install`                         | Installs dependencies                            |
| `npm run build`                       | Builds (not deploys) the code in all projects    |
| `npm run dev`                         | Starts local SST dev server                      |
| `npm run dev:site`                    | Starts the Astro site on port 4321               |
| `npm run lint`                        | Lints the code in all projects                   |
