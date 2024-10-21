import {IFarmService} from '../../../core/service/FarmService';
import {ClientBotRepository} from '../../../core/repository/ClientBotRepository/clientBotRepository';
import {IFoodService} from '../../../core/service/FoodService';
import {IClickerService} from '../../../core/service/ClickerService';
import {botInRAMRepository} from '../../database/repository/inRAMBotDateBase';
import {foodService} from './FoodService';
import {clickerService} from './ClickerService';
import {logger} from '../../logger/Logger';
import {Observable} from '../../../../env/helpers/observable';
import {toggle, toggleInfo} from '../../../../env/types';
import {FarmerEcSaver} from "./modules/FarmerEcSaver";
import {config} from "../../../core/config";
import {ExpEcSaver} from "./modules/ExpSaver";

export class FarmService implements IFarmService {
    private farmMap = new Map<string, {
        isFarm: boolean,
        farmSaver: FarmerEcSaver,
        expSaver: ExpEcSaver
    }>();
    $farm = new Observable<{ id: string, action: toggle }>()

    constructor(
        private botRepository: ClientBotRepository,
        private foodService: IFoodService,
        private clickerService: IClickerService,
    ) {
    }

    startFarm(id: string): void {
        const bot = this.botRepository.getById(id)._bot
        this.clickerService.startAttackClicker(id, 700)
        this.foodService.startAutoFood(id)

        let farmSaver = null
        let expSaver = null
        if (config.saveFarmer) {
            farmSaver = new FarmerEcSaver(bot, {
                whiteList: config.nearPlayersWhiteList,
                timeoutReturn: config.timeoutFarmerReturn
            })
            farmSaver.on()
        }
        if (config.saveExp) {
            expSaver = new ExpEcSaver(bot, {
                bottleIndex: config.bottleExpIndex,
                level: config.saveExpLevel,
                bottlePrice: config.bottlePrice
            })
            expSaver.on()
        }
        const farmInfo = {
            isFarm: true,
            farmSaver: farmSaver,
            expSaver: expSaver
        }
        this.farmMap.set(id, farmInfo);

        logger.info(`${id}: Запустил автофарм`)
        this.$farm.next({id, action: 'START'})
    }

    stopFarm(id: string): void {
        this.clickerService.stopAttackClicker(id)
        this.foodService.stopAutoFeed(id)

        this.farmMap.get(id)?.farmSaver?.off()
        this.farmMap.get(id)?.expSaver?.off()
        this.farmMap.set(id, {
            isFarm: false,
            farmSaver: null,
            expSaver: null
        });

        logger.info(`${id}: Остановил автофарм`)
        this.$farm.next({id, action: 'STOP'})
    }

    getFarmState(id: string): toggleInfo {
        if (this.farmMap.get(id)?.isFarm) {
            return 'ON'
        } else {
            return 'OFF'
        }
    }
}

export const farmService = new FarmService(botInRAMRepository, foodService, clickerService)