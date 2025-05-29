import net from 'net';
/**
 * Very basic internal communication socket between processes.
 */
// Base class.
class Base {
    port;
    host;
    _on_message;
    constructor(port, host = '127.0.0.1') {
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
        while (socket.buffer.length >= 4) { // At least 4 characters for length prefix
            // Read the first 4 characters to get the message length
            const length_str = socket.buffer.slice(0, 4);
            const message_length = parseInt(length_str, 10);
            if (isNaN(message_length)) {
                console.error('Invalid message length:', length_str);
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
                }
                catch (err) {
                    console.error('Invalid JSON received:', message_str);
                }
            }
            else {
                // Wait for more data
                break;
            }
        }
    }
}
// Server class.
export class Server extends Base {
    server;
    clients;
    /**
     * Initializes the JSON Server.
     * @param {number} port - Port number to listen on.
     * @param {string} host - Host address to bind to.
     */
    constructor(port, host = '127.0.0.1') {
        super(port, host);
        this.server = net.createServer();
        this.clients = new Set();
        this.server.on('connection', (socket) => {
            console.log('Client connected:', socket.remoteAddress, socket.remotePort);
            this.clients.add(socket);
            socket.setEncoding('utf8');
            // Initialize buffer for each client
            socket.buffer = '';
            socket.on('data', (data) => {
                socket.buffer += data;
                this._process_buffer(socket);
            });
            socket.on('close', () => {
                console.log('Client disconnected:', socket.remoteAddress, socket.remotePort);
                this.clients.delete(socket);
            });
            socket.on('error', (err) => {
                console.error('Socket error:', err);
                socket.destroy();
                this.clients.delete(socket);
            });
        });
        this.server.on('error', (err) => {
            console.error('Server error:', err);
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
        const length = json.length.toString().padStart(4, '0'); // 4-digit length prefix
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
            console.log('JSON Server closed.');
        });
    }
}
// Client class.
export class Client extends Base {
    socket;
    /**
     * Initializes the JSON Client.
     * @param {number} port - Port number to connect to.
     * @param {string} host - Host address to connect to.
     */
    constructor(port, host = '127.0.0.1') {
        super(port, host);
        this.socket = net.createConnection(port, host, () => {
            console.log(`Connected to JSON Server at ${host}:${port}`);
        });
        this.socket.buffer = '';
        this.socket.setEncoding('utf8');
        this.socket.on('data', (data) => {
            this.socket.buffer += data;
            this._process_buffer(this.socket);
        });
        this.socket.on('close', () => {
            console.log('Disconnected from JSON Server');
        });
        this.socket.on('error', (err) => {
            console.error('Socket error:', err);
            this.socket.destroy();
        });
    }
    /**
     * Sends a JSON message to the server.
     * @param {Object} obj - The JSON object to send.
     */
    message(obj) {
        const json = JSON.stringify(obj);
        const length = json.length.toString().padStart(4, '0'); // 4-digit length prefix
        this.socket.write(length + json);
    }
    /**
     * Closes the client connection.
     */
    close() {
        this.socket.end();
    }
}
// Exports.
export default { Server, Client };
