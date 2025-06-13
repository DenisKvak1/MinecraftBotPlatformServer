import WebSocket from 'ws';

export class WebSocketClientsController {
	private webSocketClients: WebSocket[] = [];

	addClient(client: WebSocket) {
		this.webSocketClients.push(client);
	}

	deleteClient(client: WebSocket) {
		const index = this.webSocketClients.indexOf(client);
		this.webSocketClients.splice(index, 1);
	}

	broadcast<T>(message: T) {
		this.webSocketClients.forEach((ws) => ws.send(JSON.stringify(message)));
	}

	send<T>(ws: WebSocket, message: T) {
		ws.send(JSON.stringify(message));
	}
}

export const webSocketClients = new WebSocketClientsController();