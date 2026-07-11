/**
 * globalvariables.ts
 **
 * function：global variables
**/

/** const */
// default
export namespace myConst {
  export const DEVMODE: boolean = true;
  export const COMPANY_NAME: string = "nthree";
  export const APP_NAME: string = "myKeiba";
  export const LOG_LEVEL: string = "all";
  export const DEFAULT_ENCODING: string = "utf8";
  export const CSV_ENCODING: string = "SJIS";
  export const DEFAULT_URL: string = "https://keiba.numthree.net";
  export const FINISHED_MESSAGE_JA: string = '完了しました。デスクトップにCSVファイルを出力しました。';
  export const FINISHED_MESSAGE_EN: string = 'completed. csv file is on desktop.';
  export const WINDOW_WIDTH: number = 600; // window width
  export const WINDOW_HEIGHT: number = 1000; // window height
}

// urls
export namespace myUrls {
  export const DEF_URL_QUERY: string = "&type=2&rf=shutuba_submenu";
  export const BASE_URL: string = "https://www.netkeiba.com/";
  export const HORSE_BASE_URL: string = "https://db.netkeiba.com/horse/";
  export const TRAINING_BASE_URL: string = "https://race.netkeiba.com/race/oikiri.html";
  export const SIRE_BASE_URL: string = "https://db.netkeiba.com/horse/sire/";
  export const BASE_AUTH_URL: string = "https://regist.netkeiba.com/account/?pid=login";
}

// selectors
export namespace mySelectors {
  export const BASE_SELECTOR: string = "#contents > div > table > tbody > tr:nth-child(3) >";
  export const TURF_SELECTOR: string = `${BASE_SELECTOR} td:nth-child(13) > a`;
  export const TURF_WIN_SELECTOR: string = `${BASE_SELECTOR} td:nth-child(14) > a`;
  export const DIRT_SELECTOR: string = `${BASE_SELECTOR} td:nth-child(15) > a`;
  export const DIRT_WIN_SELECTOR: string = `${BASE_SELECTOR} td:nth-child(16) > a`;
  export const TURF_DIST_SELECTOR: string = `${BASE_SELECTOR} td:nth-child(20)`;
  export const DIRT_DIST_SELECTOR: string = `${BASE_SELECTOR} td:nth-child(21)`;
}

// races
export namespace myRaces {
  export const HORSE_CSV_COLUMNS: string[] = ['horse', 'turf', 'turfwin', 'dirt', 'dirtwin', 'turfdistanse', 'dirtdistanse'];
  export const HORSE_SCRAPE_COLUMNS: string[] = ['turf', 'turfwin', 'dirt', 'dirtwin', 'turfdistanse', 'dirtdistanse'];
  export const RACES: any = {
    '札幌': 'Sapporo',
    '函館': 'Hakodate',
    '福島': 'Fukushima',
    '新潟': 'Niigata',
    '東京': 'Tokyo',
    '中山': 'Nakayama',
    '中京': 'Chukyo',
    '京都': 'Kyoto',
    '阪神': 'Hanshin',
    '小倉': 'Kokura',
  };
}
