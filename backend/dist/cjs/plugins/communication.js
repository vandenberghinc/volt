var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  Client: () => Client,
  Server: () => Server,
  default: () => stdin_default
});
module.exports = __toCommonJS(stdin_exports);
var import_net = __toESM(require("net"));
class Base {
  port;
  host;
  _on_message;
  constructor(port, host = "127.0.0.1") {
    this.port = port;
    this.host = host;
    this._on_message = null;
  }
  // Set on message.
  on_message(callback) {
    this._on_message = callback;
    return this;
  }
  /**
   * Processes the buffer to extract complete messages.
   * Handles multiple consecutive messages.
   * @param {net.Socket} socket - The client socket.
   */
  _process_buffer(socket) {
    while (socket.buffer.length >= 4) {
      const length_str = socket.buffer.slice(0, 4);
      const message_length = parseInt(length_str, 10);
      if (isNaN(message_length)) {
        console.error("Invalid message length:", length_str);
        socket.destroy();
        break;
      }
      if (socket.buffer.length >= 4 + message_length) {
        const message_str = socket.buffer.slice(4, 4 + message_length);
        socket.buffer = socket.buffer.slice(4 + message_length);
        try {
          const message = JSON.parse(message_str);
          if (this._on_message)
            this._on_message(message, socket);
        } catch (err) {
          console.error("Invalid JSON received:", message_str);
        }
      } else {
        break;
      }
    }
  }
}
class Server extends Base {
  server;
  clients;
  /**
   * Initializes the JSON Server.
   * @param {number} port - Port number to listen on.
   * @param {string} host - Host address to bind to.
   */
  constructor(port, host = "127.0.0.1") {
    super(port, host);
    this.server = import_net.default.createServer();
    this.clients = /* @__PURE__ */ new Set();
    this.server.on("connection", (socket) => {
      console.log("Client connected:", socket.remoteAddress, socket.remotePort);
      this.clients.add(socket);
      socket.setEncoding("utf8");
      socket.buffer = "";
      socket.on("data", (data) => {
        socket.buffer += data;
        this._process_buffer(socket);
      });
      socket.on("close", () => {
        console.log("Client disconnected:", socket.remoteAddress, socket.remotePort);
        this.clients.delete(socket);
      });
      socket.on("error", (err) => {
        console.error("Socket error:", err);
        socket.destroy();
        this.clients.delete(socket);
      });
    });
    this.server.on("error", (err) => {
      console.error("Server error:", err);
    });
    this.server.listen(port, host, () => {
      console.log(`JSON Server listening on ${host}:${port}`);
    });
  }
  /**
   * Sends a JSON message to a specific socket.
   * @param {net.Socket} socket - The socket to send the message to.
   * @param {Object} obj - The JSON object to send.
   */
  message(socket, obj) {
    const json = JSON.stringify(obj);
    const length = json.length.toString().padStart(4, "0");
    socket.write(length + json);
  }
  /**
   * Broadcasts a JSON message to all connected clients.
   * @param {Object} obj - The JSON object to broadcast.
   */
  broadcast(obj) {
    for (let socket of this.clients) {
      this.message(socket, obj);
    }
  }
  /**
   * Closes the server and all client connections.
   */
  close() {
    for (let socket of this.clients) {
      socket.destroy();
    }
    this.server.close(() => {
      console.log("JSON Server closed.");
    });
  }
}
class Client extends Base {
  socket;
  /**
   * Initializes the JSON Client.
   * @param {number} port - Port number to connect to.
   * @param {string} host - Host address to connect to.
   */
  constructor(port, host = "127.0.0.1") {
    super(port, host);
    this.socket = import_net.default.createConnection(port, host, () => {
      console.log(`Connected to JSON Server at ${host}:${port}`);
    });
    this.socket.buffer = "";
    this.socket.setEncoding("utf8");
    this.socket.on("data", (data) => {
      this.socket.buffer += data;
      this._process_buffer(this.socket);
    });
    this.socket.on("close", () => {
      console.log("Disconnected from JSON Server");
    });
    this.socket.on("error", (err) => {
      console.error("Socket error:", err);
      this.socket.destroy();
    });
  }
  /**
   * Sends a JSON message to the server.
   * @param {Object} obj - The JSON object to send.
   */
  message(obj) {
    const json = JSON.stringify(obj);
    const length = json.length.toString().padStart(4, "0");
    this.socket.write(length + json);
  }
  /**
   * Closes the client connection.
   */
  close() {
    this.socket.end();
  }
}
var stdin_default = { Server, Client };
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Client,
  Server
});
