<p align="center">
<img src="https://github.com/vandenberghinc/volt/blob/main/dev/media/icon/stroke.png?raw=true" alt="Volt" width="500">
</p>  
Creating websites with ease.
<br><br>
<p align="center">
    <img src="https://img.shields.io/badge/version-{{VERSION}}-orange" alt="Bergh-Encryption">
    <img src="https://img.shields.io/badge/std-c++20-orange" alt="Bergh-Encryption">
    <img src="https://img.shields.io/badge/status-maintained-forestgreen" alt="Bergh-Encryption">
    <img src="https://img.shields.io/badge/dependencies-vlib-yellow" alt="Bergh-Encryption">
    <img src="https://img.shields.io/badge/OS-MacOS & Linux-blue" alt="Bergh-Encryption">
</p> 
<br><br>

## In Development.
This library is currently still in development.
<br><br>

<!-- ## Documentation.
Full documentation at [Github Pages](https://vandenberghinc.github.io/volt). -->

## Project hierarchy.
When creating a website using volt it is advised to create the following project hierarchy. The `server.js` file must either reside at `./server/server.js` or at `./server.js`.
```
website/
    server/
        config.js - Use this file to define the Server object and export it in module.exports either under the attribute `server` or as the export itself.
        endpoints.js - For example use this file to define your endpoints.
        server.js - Use this file to import the server and require all endpoints. This file must be named server.js for the volt cli.
    ...
```

###### config.js
```javascript
// Imports.
import * as volt from "@vandenberghinc/volt";

// Initialize the server.
export const server = new volt.Server({
    ...
})
```

###### endpoints.js
```javascript
// Imports.
import { server } from "./config.js"

// Create an endpoint.
server.endpoint({
    endpoint: "/",
    view: { source: "./home.js" } // automatically bundled using esbuild.
});

// Create a restapi endpoint.
server.endpoint({
    endpoint: "/",
    params: {
        name: { type: "string", def: "World" },
        opts: { type: "object", required: false, scheme: {
            x: "string",
        }},
    },
    authenticated: false,
    callback(stream, params) {
        if (...) {
            return stream.error({ status: server.status.bad_request, message: "Bad request" });
        }
        return stream.send({
            status: 200,
            data: {
                greeting: `Hello ${params.name}`,
            }
        })
    }
});

export {}
```

###### home.js
```javascript
// Imports.
import * as volt from "@vandenberghinc/volt/frontend";

// Create page.
volt.utils.on_load(() => {
    return volt.View(
        volt.Title("Hello world!")
            .color("red"),
        volt.Text("This is an example")
            .on_render(e => {
                e.color("blue");
                console.log("volt.Text rendered.");
            })
            .on_resize(e => {
                console.log("volt.Text resized.");
            }),
    )
})
```

###### server.js
```javascript
// Imports.
import { server } from "./config.js"

// Load endpoints.
import "./endpoints.js";

// Start the server.
await server.start();
```