import { Subscribe } from '../../../env/helpers/observable';

export interface ICaptchaService {
    loadCaptcha(id: string, captchaPreset: CaptchaPreset): Promise<Buffer>;
    onCaptcha(id: string, callback: (image: Buffer)=> void):Subscribe
}
export type CaptchaPreset = {
    resultPath: string
    mapsPath: string
    rows: number
    cols: number
    startX: number
    startY: number
    invertRows?: boolean
    invertCol?: boolean
}