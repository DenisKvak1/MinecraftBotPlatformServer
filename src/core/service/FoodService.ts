import { Subscribe } from '../../../env/helpers/observable';

export interface IFoodService {
	startAutoFood(id: string): void
	stopAutoFeed(id: string): void
}