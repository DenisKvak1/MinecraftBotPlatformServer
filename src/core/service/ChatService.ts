import { Subscribe } from '../../../env/helpers/observable';

export interface IChatService {
	onChatMessage(id: string, callback: (message: string)=> void): Subscribe
	sendMessage(id: string, message: string): void
}