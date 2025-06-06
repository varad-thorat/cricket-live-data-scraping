This is a [Plasmo extension](https://docs.plasmo.com/) project bootstrapped with [`plasmo init`](https://www.npmjs.com/package/plasmo).
## Prerequisites 
Node.js

## Getting Started
First , download the pnpm package manager to create plasmo project.

```bash
npm install -g pnpm@latest-10
```

## What is PNPM:
pnpm is a fast, disk space-efficient package manager and a drop-in replacement for npm and yarn. Unlike npm, it uses a content-addressable file system to save space: instead of duplicating files for each project, it stores a single copy in a central store and links dependencies via symlinks. 

## What is Plasmo:
Plasmo is a modern framework for building browser extensions using React and TypeScript. It simplifies extension development by providing features like hot reload, automatic manifest generation, environment variable support, and cross-browser compatibility (Chrome, Firefox, etc.).
Simply saying it is like react or next.js for browser extension , it provides realtime build rather than always loading the build file.

## Afer this:

```
cd cricket-extension
```

Install all the dependencies by running -
```
npm install
```
Run the development server:

```bash
pnpm dev
# or
npm run dev
```

## Loading the build file locally in your browser extension-

Then, load the extension locally in your browser:

Open your browser (e.g., Chrome).

Navigate to chrome://extensions/.

Enable Developer Mode (top-right toggle).

Click Load Unpacked.

Select the folder: cricket-extension/build/chrome-mv3-dev

----------------------------------------------------------------

Open your browser and load the appropriate development build. For example, if you are developing for the chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.

You can start editing the popup by modifying `popup.tsx`. It should auto-update as you make changes. To add an options page, simply add a `options.tsx` file to the root of the project, with a react component default exported. Likewise to add a content page, add a `content.ts` file to the root of the project, importing some module and do some logic, then reload the extension on your browser.

For further guidance, [visit our Documentation](https://docs.plasmo.com/)

## Making production build

Run the following:

```bash
pnpm build
# or
npm run build
```

This should create a production bundle for your extension, ready to be zipped and published to the stores.

## Submit to the webstores

The easiest way to deploy your Plasmo extension is to use the built-in [bpp](https://bpp.browser.market) GitHub action. Prior to using this action however, make sure to build your extension and upload the first version to the store to establish the basic credentials. Then, simply follow [this setup instruction](https://docs.plasmo.com/framework/workflows/submit) and you should be on your way for automated submission!

