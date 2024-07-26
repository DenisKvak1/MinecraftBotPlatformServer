import { IObservable, Subscribe } from '../../../env/helpers/observable';
import { BotStatus, ClientAccountModel } from '../model/AccountModel';

export interface IClientManagerService {
	$connect: IObservable<{id: string}>,
	$disconnect: IObservable<{id: string}>
	connect(id: string): void;
	disconnect(id: string): void;
	onDisconnect(id: string, callback: (reason: string) => void): Subscribe;
	isPossibleBot(id: string): Promise<boolean>;
	onceSpawn(id: string, callback: () => void): void;
	checkOnline(id: string): Promise<boolean>
	getStatus(id: string): BotStatus
	onSpawn(id: string, callback: () => void): Subscribe
	onDamage(id: string, callback: () => void): Subscribe
	onDeath(id: string, callback: () => void): Subscribe
}
