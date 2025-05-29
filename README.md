# Volt
TS library for creating a web server, including a SwiftUI inspired frontend module. 

<!-- ## Documentation.
Full documentation at [Github Pages](https://vandenberghinc.github.io/volt). -->

## Project hierarchy.
When creating a project using volt it is advised to create the following project hierarchy.
* `website/`
    * `server/`
        * `config.js` - Use this file to define and export the Server instance.
        * `server.js` - A file that imports the server and all endpoints and optionall re-exports the server.
        * `start.js` - A file that imports `server.js` and calls `server.start()`.

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


































<!--
<p align="center">
<img src="https://github.com/vandenberghinc/volt/blob/main/dev/media/icon/stroke.png?raw=true" alt="Volt" width="500">
</p>  
Creating websites with ease.
<br><br>
<p align="center">
    <img 
        src="https://img.shields.io/badge/version-{{VERSION}}-orange" 
        alt="@vandenberghinc/vlib"
    >
    <img
        src="https://img.shields.io/badge/status-maintained-forestgreen" 
        alt="@vandenberghinc/vlib"
    >
    <img src="https://img.shields.io/badge/std-c++20-orange" alt="B@vandenberghinc/vlib">
    <img
        src="https://img.shields.io/badge/dependencies-vlib-yellow" 
        alt="@vandenberghinc/vlib"
    >
    <img
        src="https://img.shields.io/badge/OS-MacOS & Linux-blue"
        alt="@vandenberghinc/vlib"
    >
</p> 
<br><br>
-->