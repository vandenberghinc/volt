<p align="center">
<img src="https://github.com/vandenberghinc/vweb/blob/main/dev/media/icon/stroke.png?raw=true" alt="VWeb" width="500">
</p>  
Easily create websites or REST APIs in pure c++ with the library VWeb. Website views are built in a SwiftUI like manner. The backend can run on on HTTP only or on HTTP and HTTPS both.
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

## Documentation.
Full documentation at [Github Pages](https://vandenberghinc.github.io/vweb).

## Project hierarchy.
When creating a website using vweb it is advised to create the following project hierarchy. The `server.js` file must either reside at `./server/server.js` or at `./server.js`.
```
website/
    server/
        config.js - Use this file to define the Server object and export it in module.exports either under the attribute `server` or as the export itself.
        endpoints.js - For example use this file to define your endpoints.
        server.js - Use this file to import the server and require all endpoints. This file must be named server.js for the vweb cli.
    ...
```

###### config.js
```javascript
// Imports.
const vweb = require("@vandenberghinc/vweb");

// Initialize the server.
const server = new vweb.Server({
    ...
})

// Exports.
module.exports = {
    server,
};
```

###### endpoints.js
```javascript
// Imports.
const {server} = require("./config.js");

// Create an endpoint.
server.endpoint({
    ...
});
```

###### server.js
```javascript
// Imports.
const {server} = require("./config.js");

// Load endpoints.
require("./endpoints.js");
```