import { Subscribe } from '../../../env/helpers/observable';

export interface IChatService {
	onChatMessage(id: string, callback: (message: string)=> void): Subscribe
	onPersonalMessage(id: string, callback: (message: string, username: string)=> void): void
	sendMessage(id: string, message: string): void
}