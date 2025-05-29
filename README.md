<!--<p align="center">
  <img src="https://github.com/vandenberghinc/volt/blob/main/dev/media/icon/stroke.png?raw=true" alt="Volt Logo" width="200">
</p>-->

<p align="center">
  <img src="https://img.shields.io/badge/version-1.1.23-orange" alt="Version">
  <img src="https://img.shields.io/badge/language-TypeScript-blue" alt="Language">
  <img src="https://img.shields.io/badge/status-in%20development-forestgreen" alt="Status">
  <img src="https://img.shields.io/badge/OS-MacOS%20%26%20Linux-blue" alt="OS">
</p>

# Volt – TypeScript Web Framework

**Volt** is an open‑source framework for building dynamic websites and web apps in TypeScript. It combines a SwiftUI‑inspired **frontend UI library** with a powerful **Node.js backend server**, so you can create full‑stack applications in a single cohesive project.

## Architecture

* **Declarative UI Frontend** – Build views with composable components such as `volt.Title`, `volt.Text`, and `volt.View`. Chain modifiers for styling and lifecycle hooks (`.on_render`, `.on_resize`, etc.). Volt translates your code into real DOM elements.
* **Modular Backend Server** – Instantiate `new volt.Server()` to configure your app, then declare endpoints with a concise API. Routes can serve compiled frontend views *or* act as REST endpoints returning JSON.
* **Seamless Integration** – When an endpoint points to a frontend `view`, Volt bundles that module on‑the‑fly (via esbuild) and embeds it in the HTML response. No separate build step is required.

## Installation

```bash
npm install @vandenberghinc/volt
```

Volt supports Node 16+ and native ES modules.

## Recommended Project Layout

```
my‑website/
├── server/
│   ├── config.js      // create and configure the server
│   ├── endpoints.js   // define all routes
│   └── server.js      // start the server
├── home.js            // example frontend view
└── package.json
```

## Quick‑Start Example

Below is a minimal “Hello World” site with a JSON API.

<details>
<summary>server/config.js</summary>

```js
import * as volt from "@vandenberghinc/volt";

export const server = new volt.Server({
  // domain: "localhost",
  // port: 3000,
  // source: __dirname + "/..",
  // company: { name: "MySite" }
});
```

</details>

<details>
<summary>server/endpoints.js</summary>

```js
import { server } from "./config.js";

// Home page served at "/"
server.endpoint({
  endpoint: "/",
  view: { source: "./home.js" }
});

// JSON API at "/api/hello"
server.endpoint({
  endpoint: "/api/hello",
  method: "GET",
  params: {
    name: { type: "string", def: "World" }
  },
  callback(stream, params) {
    return stream.send({
      status: 200,
      data: { message: `Hello, ${params.name}!` }
    });
  }
});
```

</details>

<details>
<summary>home.js</summary>

```js
import * as volt from "@vandenberghinc/volt/frontend";

volt.utils.on_load(() => {
  return volt.View(
    volt.Title("Hello, Volt!").color("red"),
    volt.Text("This is a Volt example page.")
      .on_render(el => {
        el.color("blue");
        console.log("Text rendered");
      })
  );
});
```

</details>

<details>
<summary>server/server.js</summary>

```js
import { server } from "./config.js";
import "./endpoints.js";

await server.start();
console.log("Volt server running…");
```

</details>

### Run

```bash
node server/server.js
```

Visit **[http://localhost/](http://localhost/)** to see the page, or **[http://localhost/api/hello?name=Alice](http://localhost/api/hello?name=Alice)** for the JSON response.

---

Explore the codebase, file issues, and open pull requests—contributions are welcome!
