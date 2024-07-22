import { WebSocketClientsController } from '../module/WebSocketClientsController';
import { IncomingMessage, OutgoingReplayMessage, STATUS } from '../../../../env/types';

export function returnWSOk(message: IncomingMessage, wsClients: WebSocketClientsController) {
	wsClients.broadcast<OutgoingReplayMessage>({
		command: message.command,
		botID: message.botID,
		status: STATUS.SUCCESS,
	});
}

export function returnWSError(message: IncomingMessage, errorMessage:string, wsClients: WebSocketClientsController){
	wsClients.broadcast<OutgoingReplayMessage>({
		command: message.command,
		botID: message.botID,
		status: STATUS.ERROR,
		errorMessage
	});
}