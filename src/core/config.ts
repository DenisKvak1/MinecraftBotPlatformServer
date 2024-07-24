import { CaptchaPreset } from './service/CaptchaService';
import path from 'node:path';
export function getProfileCaptcha(botProfile: BotProfile) {
    switch (botProfile) {
        case BotProfile.FUNTIME:
            return FuntimeCaptcha
        case BotProfile.HOLYWORLD:
            return HolyWorldCaptcha
    }
}
export function getProfile(botProfile: BotProfile) {
    switch (botProfile) {
        case BotProfile.FUNTIME:
            return FuntimeProfile
        case BotProfile.HOLYWORLD:
            return HolyWorldProfile
    }
}


export enum BotProfile {
    FUNTIME = "FUNTIME",
    HOLYWORLD = "HOLYWORLD",
}
export const FuntimeProfile = {
    host: 'mc.funtime.su',
    port: 25565,
    version: '1.16.5'
}

export const HolyWorldProfile = {
    host: 'mc.holyworld.io',
    port: 25565,
    version: '1.18.1'
}

export const FuntimeCaptcha: CaptchaPreset = {
    mapsPath: path.resolve(process.cwd(), './captcha/maps/'),
    resultPath: path.resolve(process.cwd(), './captcha/result/result.jpg'),
    rows: 2,
    cols: 3,
    startX: 4,
    startY: 253
}
export const HolyWorldCaptcha: CaptchaPreset = {
    mapsPath: path.resolve(process.cwd(), './captcha/maps/'),
    resultPath: path.resolve(process.cwd(), './captcha/result/result.jpg'),
    rows: 3,
    cols: 4,
    startX: 10,
    startY: 67
}
