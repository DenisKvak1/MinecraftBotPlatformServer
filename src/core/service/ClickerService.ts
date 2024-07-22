export interface IClickerService {
	attack(id: string): void
	startAttackClicker(id:string, interval: number): void;
	stopAttackClicker(id:string): void;
	startUseItemClicker(id:string, interval: number): void;
	stopUseItemClicker(id:string): void;
}