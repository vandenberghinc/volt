import net from 'net';
declare module 'net' {
    interface Socket {
        buffer: string;
    }
}
/**
 * Very basic internal communication socket between processes.
 */
declare class Base {
    port: number;
    host: string;
    _on_message: ((message: any, socket: net.Socket) => void) | null;
    constructor(port: number, host?: string);
    on_message(callback: (message: any, socket: net.Socket) => void): this;
    /**
     * Processes the buffer to extract complete messages.
     * Handles multiple consecutive messages.
     * @param {net.Socket} socket - The client socket.
     */
    _process_buffer(socket: net.Socket): void;
}
export declare class Server extends Base {
    server: net.Server;
    clients: Set<net.Socket>;
    /**
     * Initializes the JSON Server.
     * @param {number} port - Port number to listen on.
     * @param {string} host - Host address to bind to.
     */
    constructor(port: number, host?: string);
    /**
     * Sends a JSON message to a specific socket.
     * @param {net.Socket} socket - The socket to send the message to.
     * @param {Object} obj - The JSON object to send.
     */
    message(socket: net.Socket, obj: Record<string, any>): void;
    /**
     * Broadcasts a JSON message to all connected clients.
     * @param {Object} obj - The JSON object to broadcast.
     */
    broadcast(obj: Record<string, any>): void;
    /**
     * Closes the server and all client connections.
     */
    close(): void;
}
export declare class Client extends Base {
    socket: net.Socket;
    /**
     * Initializes the JSON Client.
     * @param {number} port - Port number to connect to.
     * @param {string} host - Host address to connect to.
     */
    constructor(port: number, host?: string);
    /**
     * Sends a JSON message to the server.
     * @param {Object} obj - The JSON object to send.
     */
    message(obj: Record<string, any>): void;
    /**
     * Closes the client connection.
     */
    close(): void;
}
declare const _default: {
    Server: typeof Server;
    Client: typeof Client;
};
export default _default;
