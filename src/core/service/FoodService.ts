import { toggleInfo } from '../../../env/types';

export interface IFoodService {
	startAutoFood(id: string): void
	stopAutoFeed(id: string): void
	getAutoFoodStatus(id: string): toggleInfo
}