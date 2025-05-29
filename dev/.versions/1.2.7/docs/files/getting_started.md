---
name: getting_started
description: Getting started with vweb.
navigation: JS
chapter: Getting Started
title: Getting Started
---

# Getting started
Building a simple hello world website with vweb.

## Hierarchy
Create the a directory with the following hierarchy:
 - my_website/
 - my_website/.vweb
 - my_website/start.cpp
 - my_website/my_view.h
 
```
$ mkdir my_website
$ touch my_website/.vweb
$ touch my_website/start.cpp
$ touch my_website/my_view.h
```

## File my_website/.vweb
Create the vweb configuration file. See <Type>vweb::server::Config</Type> for more information. 
```cpp
{

   	 // Server configuration.
	"server": {
		"ip": "*",                              // the ip, leave "*" to run on the generic ip.
		"port": 8000,                           // the port to run on, define -1 to run both on http and https.
		"static": "$BASE/static",               // the path to the static files directory.
		"database": "$BASE/.db",                // the path to the database directory.
		"enable_2fa": true,                     // enable 2fa using email.
		"keep_alive": 5,                        // keep alive for idle connections in seconds.
		"max_connections": 10000,               // max simultaneous connections.
		"max_threads": 25,                      // max worker threads.
		"log_level": 1,                         // -1..5
	},
	
	 // Domain configuration.
	"domain": {
		"name": "Hello World Website",          // the name of the website.
		"domain": "127.0.0.1:8000",             // the domain url without http:// or https://.
	},

    // Build settings.
    //  - Every value in the build json can be a direct value for all ...
    //    operating systems, or another json with os specific values.
    //    Currently only operating systems "linux" and "macos" are supported.
    "build": {
        "compiler": "g++",
        "std": "c++2b",
        "include_paths": ["/opt/vinc/include", "/opt/homebrew/opt/openssl@3.1/include/"], "\n"
        "library_paths": ["/opt/homebrew/opt/openssl@3.1/lib/"],
        "linked_libraries": {
            "macos": ["-lssl", "-lcrypto", "-lz"],
            "linux": ["-lssl", "-lcrypto", "-lz", "-lcrypt", "-ldl"],
        },
        "other_flags": ["-g"],
    },

}
```

## File my_website/my_view.h
Create a hello world UI view. 
```cpp
Endpoint my_view () {
    return Endpoint {
        "/",
        View {
            Title("Hello World!"),
        },
    };
}
```

## File my_website/server.cpp
Create the server file that starts the server. This file must be named `server.cpp`. 
```cpp

// Include libraries.
#include <vlib/vlib.h>
#include <vweb/vweb.h>

// Shortcuts.
using namespace vlib::types::shortcuts;
using namespace vweb::shortcuts;
using namespace vweb::ui::shortcuts;

// Include UI endpoints.
#include "my_view.h"

// Main.
int main () {

    // Initialize server.
    Server server = vweb::server::Config(Path(__FILE__).base().join(".vweb"));

    // Add endpoints.
    server.add_endpoints(
        my_view()
    );

    // Start.
    server.start();

}
```

## Run the website
Run the website with the following command.
```
$ cd my_website
$ vweb --start
```

## Open the website
Open the [website](http://127.0.0.1:8000/) in a browser.
