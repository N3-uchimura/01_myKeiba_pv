/**
 * mykeiba.ts
 *
 * mykeiba - Getting keiba data from netkeiba. -
**/

'use strict';

/// Constants
// name space
import { myConst, myDevConst, myUrls, mySelectors, myRaces } from './consts/globalvariables';

/// Variables
let globalAppName: string = '';
let globalLogLevel: string = '';
// devmode
if (myConst.DEVMODE) {
  globalAppName = myDevConst.DEV_APP_NAME;
  globalLogLevel = myDevConst.DEV_LOG_LEVEL;
} else {
  globalAppName = myConst.APP_NAME;
  globalLogLevel = myConst.LOG_LEVEL;
}

/// Modules
import * as path from 'node:path'; // path
import { readFile, writeFile } from 'node:fs/promises'; // filesystem
import axios from 'axios'; // http
import { BrowserWindow, app, ipcMain, Tray, Menu, nativeImage } from 'electron'; // electron
import { config as dotenv } from 'dotenv'; // dotenv
import { Scrape } from './class/ElScrapeCore1003'; // custom Scraper
import ELLogger from './class/ElLogger'; // logger
import Dialog from './class/ElDialog1124'; // dialog
import CSV from './class/ElCsv0414'; // aggregator
import NodeCache from 'node-cache'; // node-cache
/// Variables
let globalRootPath: string; // root path
// production
if (!myConst.DEVMODE) {
  globalRootPath = path.join(path.resolve(), 'resources')
  // development
} else {
  globalRootPath = path.join(__dirname, '..');
}
// env setting
dotenv({ path: path.join(globalRootPath, 'assets', '.env') });
// desktop path
const dir_home =
  process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME'] ?? '';
const dir_desktop = path.join(dir_home, 'Desktop');
// loggeer instance
const logger: ELLogger = new ELLogger(myConst.COMPANY_NAME, globalAppName, globalLogLevel);
// scrapeMaker
const scrapeMaker = new Scrape(logger);
// aggregator
const csvMaker = new CSV(myConst.CSV_ENCODING, logger);
// dialog
const dialogMaker: Dialog = new Dialog(logger);
// cache
const cacheMaker: NodeCache = new NodeCache();
// ID
const NETKEIBA_ID: string = process.env.NETKEIBA_ID!;
// PASS
const NETKEIBA_PASS: string = process.env.NETKEIBA_PASS!;

/// interfaces
// window option
interface windowOption {
  width: number; // window width
  height: number; // window height
  defaultEncoding: string; // default encode
  webPreferences: Object; // node
}

/*
 main
*/
// main window
let mainWindow: any = null;
// quit flg
let isQuiting: boolean;
// result array
let globalResultArray: any[] = [];

// make window
const createWindow = (): void => {
  try {
    // window options
    const windowOptions: windowOption = {
      width: myConst.WINDOW_WIDTH, // window width
      height: myConst.WINDOW_HEIGHT, // window height
      defaultEncoding: myConst.DEFAULT_ENCODING, // encoding
      webPreferences: {
        nodeIntegration: false, // node
        contextIsolation: true, // isolate
        preload: path.join(__dirname, 'preload.js'), // preload
      }
    }
    // Electron window
    mainWindow = new BrowserWindow(windowOptions);
    // hide menubar
    mainWindow.setMenuBarVisibility(false);
    // load index.html
    mainWindow.loadFile(path.join(globalRootPath, 'www', 'index.html'));
    // ready
    mainWindow.once('ready-to-show', async () => {
      // not packaged
      if (!app.isPackaged) {
        // dev mode
        //mainWindow.webContents.openDevTools();
      }
    });

    // minimize and stay on tray
    mainWindow.on('minimize', (event: any): void => {
      // cancel double click
      event.preventDefault();
      // hide window
      mainWindow.hide();
      // return false
      event.returnValue = false;
    });

    // close
    mainWindow.on('close', (event: any): void => {
      // not quitting
      if (!isQuiting) {
        // except for apple
        if (process.platform !== 'darwin') {
          // quit
          app.quit();
          // return false
          event.returnValue = false;
        }
      }
    });

    // when close
    mainWindow.on('closed', (): void => {
      // destryo window
      mainWindow.destroy();
    });

  } catch (e: unknown) {
    logger.error(e);
    // error
    if (e instanceof Error) {
      // show error
      dialogMaker.showmessage('error', `${e.message}`);
    }
  }
};

// enable sandbox
app.enableSandbox();

// avoid double ignition
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  // show error message
  dialogMaker.showmessage('error', 'Double ignition. break.');
  // close app
  app.quit();
}

// ready
app.on('ready', async () => {
  logger.info('app: electron is ready');
  // make window
  createWindow();
  // menu label
  let displayLabel: string = '';
  // close label
  let closeLabel: string = '';
  // get language
  const language = cacheMaker.get('language') ?? 'japanese';
  // switch on language
  if (language == 'japanese') {
    // set menu label
    displayLabel = '表示';
    // set close label
    closeLabel = '閉じる';
  } else {
    // set menu label
    displayLabel = 'show';
    // set close label
    closeLabel = 'close';
  }
  // app icon
  const icon: Electron.NativeImage = nativeImage.createFromPath(
    path.join(globalRootPath, 'assets/keiba128.ico')
  );
  // tray
  const mainTray: Electron.Tray = new Tray(icon);
  // contextMenu
  const contextMenu: Electron.Menu = Menu.buildFromTemplate([
    // show
    {
      label: displayLabel,
      click: () => {
        mainWindow.show();
      },
    },
    // close
    {
      label: closeLabel,
      click: () => {
        isQuiting = true;
        app.quit();
      },
    },
  ]);
  // set contextMenu
  mainTray.setContextMenu(contextMenu);
  // show on double click
  mainTray.on('double-click', () => mainWindow.show());
});

// activated
app.on('activate', async () => {
  // no window
  if (BrowserWindow.getAllWindows().length === 0) {
    // reboot
    createWindow();
  }
});

// quit button
app.on('before-quit', () => {
  // flg on
  isQuiting = true;
});

// closed
app.on('window-all-closed', () => {
  logger.info('app: close app');
  // quit
  app.quit();
});


/* IPC */
// ready
ipcMain.on('beforeready', async (_, __) => {
  logger.info('app: beforeready app');
  // language
  const initlanguage = await readFile(path.join(globalRootPath, 'assets', 'language.txt'), 'utf8');
  // language
  cacheMaker.set('language', initlanguage);
  // be ready
  mainWindow.send('ready', initlanguage);
});

// config
ipcMain.on('config', async (_, __: any) => {
  logger.info('app: config app');
  // language
  const language = cacheMaker.get('language') ?? 'japanese';
  // goto config page
  await mainWindow.loadFile(path.join(globalRootPath, 'www', 'config.html'));
  // language
  mainWindow.send('confready', language);
});

// save
ipcMain.on('save', async (_, arg: any) => {
  logger.info('app: save config');
  // language
  const language: string = String(arg.language);
  // save
  await writeFile(path.join(globalRootPath, 'assets', 'language.txt'), language);
  // language
  cacheMaker.set('language', language);
  // goto config page
  await mainWindow.loadFile(path.join(globalRootPath, 'www', 'index.html'));
  // language
  mainWindow.send('topready', language);
});

// top
ipcMain.on('top', async (_, __: any) => {
  logger.info('app: top');
  // goto config page
  await mainWindow.loadFile(path.join(globalRootPath, 'www', 'index.html'));
  // language
  const language = cacheMaker.get('language') ?? 'japanese';
  // language
  mainWindow.send('topready', language);
});

// pause
ipcMain.on("pause", async () => {
  try {
    logger.info("ipc: pause mode");
    // question
    let questionHeader: string = '';
    // question
    let questionMessage: string = '';
    // language
    const language = cacheMaker.get('language') ?? '';
    // switch on language
    if (language == 'japanese') {
      // set finish message
      questionHeader = '停止';
      questionMessage = myConst.QUESTION_MESSAGE_JA;
    } else {
      // set finish message
      questionHeader = 'stop';
      questionMessage = myConst.QUESTION_MESSAGE_EN;
    }
    // show question dialog
    const selected: number = dialogMaker.showQuetion('Q', questionHeader, questionMessage);
    // yes
    if (selected == 0) {
      // today date
      const formattedDate: string = 'sire_' + getNowDate();
      // file path
      const filePath: string = path.join(dir_desktop, formattedDate + '.csv');
      // write to CSV
      await csvMaker.makeCsvData(globalResultArray, myRaces.HORSE_CSV_COLUMNS, filePath);
      // pause message
      dialogMaker.showmessage("info", "stopped.");
      // close
      app.quit();

    } else {
      return false;
    }

  } catch (e: unknown) {
    // error
    if (e instanceof Error) {
      // error
      logger.error(e.message);
    }
  }
});

// exit
ipcMain.on('exitapp', async (_, __) => {
  logger.info('app: exit app');
  // excrpt for apple
  if (process.platform !== 'darwin') {
    // exit app
    app.quit();
    return false;
  }
});

// error
ipcMain.on('error', async (_, arg: any) => {
  logger.info('ipc: error mode');
  // show error
  dialogMaker.showmessage('error', arg);
});

// get horse sire
ipcMain.on('sire', async (event: any, arg: any) => {
  try {
    logger.info('sire: getsire mode');
    // success Counter
    let successCounter: number = 0;
    // fail Counter
    let failCounter: number = 0;
    // status message
    let statusmessage: string;
    // finish message
    let endmessage: string;

    // selector array
    const selectorArray: string[] = [mySelectors.TURF_SELECTOR, mySelectors.TURF_WIN_SELECTOR, mySelectors.DIRT_SELECTOR, mySelectors.DIRT_WIN_SELECTOR, mySelectors.TURF_DIST_SELECTOR, mySelectors.DIRT_DIST_SELECTOR];
    // language
    const language = cacheMaker.get('language') ?? '';
    // stallion data
    const stallionData: any = await httpsPost(`${myConst.DEFAULT_URL}/horse/getstallion`, {});
    logger.silly(stallionData);
    // extract first column
    const stallions: string[] = stallionData.map((item: any) => item.stallionname);
    // extract second column
    const urls: string[] = stallionData.map((item: any) => item.url);
    // initialize
    await scrapeMaker.init();
    logger.debug('sire: initialize end');

    // loop words
    for (let i: number = 0; i < urls.length; i++) {
      try {
        // empty array
        let tmpObj: any = {
          horse: '', // horse name
          turf: '', // turf ratio
          turfwin: '', // turf win
          dirt: '', // dirt ratio
          dirtwin: '', // dirt win
          turfdistanse: '', // turf average distance
          dirtdistanse: '', // dirt average distance
        };
        // url
        const sireUrl: string = myUrls.SIRE_BASE_URL + urls[i];
        // insert horse name
        tmpObj.horse = stallions[i];
        // goto page
        await scrapeMaker.doGo(sireUrl);
        // wait for selector
        await scrapeMaker.doWaitFor(3000);
        logger.debug(`sire: goto ${sireUrl}`);
        // send totalWords
        event.sender.send('total', { len: urls.length, place: stallions[i] });
        // switch on language
        if (language == 'japanese') {
          // set finish message
          statusmessage = '種牡馬産駒成績取得中...';
        } else {
          // set finish message
          statusmessage = 'Getting crops results...';
        }
        // URL
        event.sender.send('statusUpdate', {
          status: statusmessage,
          target: tmpObj.horse
        });

        // get data
        for (let j: number = 0; j < selectorArray.length; j++) {
          try {
            // check selector
            if (await scrapeMaker.doCheckSelector(selectorArray[j])) {
              // wait for selector
              await scrapeMaker.doWaitFor(200);
              // acquired data
              const scrapedData: string = await scrapeMaker.doSingleEval(selectorArray[j], 'textContent');

              // data exists
              if (scrapedData != '') {
                tmpObj[myRaces.HORSE_SCRAPE_COLUMNS[j]] = scrapedData;
              }
              // wait for 100ms
              await scrapeMaker.doWaitFor(200);

            } else {
              logger.debug('sire: no selector');
            }

          } catch (err: unknown) {
            logger.error(err);
          }
        }
        // add to result array
        globalResultArray.push(tmpObj);
        // increment success
        successCounter++;

      } catch (error: unknown) {
        logger.error(error);
        // increment fail
        failCounter++;

      } finally {
        // send success
        event.sender.send('success', successCounter);
        // send fail
        event.sender.send('fail', failCounter);
      }
    }
    logger.debug('sire: making csv ...');
    // today date
    const formattedDate: string = 'sire_' + getNowDate();
    // file path
    const filePath: string = path.join(dir_desktop, formattedDate + '.csv');
    // make csv
    await csvMaker.makeCsvData(globalResultArray, myRaces.HORSE_CSV_COLUMNS, filePath);
    // switch on language
    if (language == 'japanese') {
      // set finish message
      endmessage = myConst.FINISHED_MESSAGE_JA;
    } else {
      // set finish message
      endmessage = myConst.FINISHED_MESSAGE_EN;
    }
    // end message
    dialogMaker.showmessage('info', endmessage);
    logger.info('sire: getsire completed.');

  } catch (e: unknown) {
    logger.error(e);
    // error
    if (e instanceof Error) {
      // error message
      dialogMaker.showmessage('error', e.message);
    }
  }
});

// get date
ipcMain.on('date', async (_: any, arg: any) => {
  try {
    logger.info('ipc: date mode');
    // aget date
    cacheMaker.set('date', arg);

  } catch (e: unknown) {
    logger.error(e);
    // error
    if (e instanceof Error) {
      // error message
      dialogMaker.showmessage('error', e.message);
    }
  }
});

// get horse training
ipcMain.on('training', async (event: any, _: any) => {
  try {
    logger.info('ipc: gettraining mode');
    // success Counter
    let successCounter: number = 0;
    // fail Counter
    let failCounter: number = 0;
    // status message
    let statusmessage: string;
    // finish message
    let endmessage: string;
    // get language
    const language = cacheMaker.get('language') ?? 'japanese';
    // get date
    const date: string = cacheMaker.get('date') ?? getNowDate();
    // race no
    const raceData: any = await httpsPost(`${myConst.DEFAULT_URL}/race/getracing`, { date: date });
    // empty
    if (raceData.no.length == 0) {
      // error message
      let racingErrorMsg: string;
      // get language
      const language = cacheMaker.get('language') ?? 'japanese';
      // switch language
      if (language == 'japanese') {
        // japanese error
        racingErrorMsg = '開催日ではありません';
      } else {
        // english error
        racingErrorMsg = 'not the racing date';
      }
      // error
      throw new Error(racingErrorMsg);
    }
    // header
    const trainingColumns: string[] = ['race', 'horse', 'date', 'place', 'condition', 'strength', 'review', 'lap1', 'lap2', 'lap3', 'lap4', 'lap5', 'color1', 'color2', 'color3', 'color4', 'color5'];

    // initialize
    await scrapeMaker.init();
    // goto netkeiba
    await scrapeMaker.doGo(myUrls.BASE_AUTH_URL);
    logger.debug(`goto ${myUrls.BASE_AUTH_URL}`);
    // wait for id/pass input
    await scrapeMaker.doWaitFor(3000);
    // input id
    await scrapeMaker.doType("input[name='login_id']", NETKEIBA_ID);
    // input pass
    await scrapeMaker.doType("input[name='pswd']", NETKEIBA_PASS);
    // wait 3 sec
    await scrapeMaker.doWaitFor(3000);
    // click login button
    await scrapeMaker.doClick('.loginBtn__wrap input');
    // wait 3 sec
    await scrapeMaker.doWaitFor(3000);

    // for race loop
    const racenums: number[] = [...Array(12)].map((_, i) => i + 1);
    // loop each races
    for (const [idx, _] of Object.entries(raceData.no)) {
      let targetIdx: number;
      // course name
      let targetCourseName: string;
      // finaljson
      let finalJsonArray: any[] = [];
      // initialize success counter
      successCounter = 0;
      // initialize fail counter
      failCounter = 0;
      // index
      targetIdx = Number(idx);
      // get language
      const localLanguage = cacheMaker.get('language') ?? 'japanese';
      // switch language
      if (localLanguage == 'japanese') {
        // set japanese racing cource
        targetCourseName = raceData.place[targetIdx];
      } else {
        // set english racing cource
        targetCourseName = myRaces.RACES[raceData.place[targetIdx]];
      }
      // raceid
      const targetRaceId: string = raceData.no[targetIdx];
      // base url
      const baseUrl: string = `${myUrls.TRAINING_BASE_URL}?race_id=${targetRaceId}`;

      // send totalWords
      event.sender.send('total', {
        len: 12, // the number of race
        place: date + targetCourseName, // racing course
      });

      // loop each races
      for (const j of racenums) {
        try {
          // tmp JsonArray
          let tmpJsonArray: any[] = [];
          // post Array
          let postArray: any[] = [];
          // url
          const targetUrl: string = `${baseUrl}${String(j).padStart(2, '0')}${myUrls.DEF_URL_QUERY}`;
          // goto site
          await scrapeMaker.doGo(targetUrl);
          logger.debug(`scraping ${targetUrl}`);
          // wait for datalist
          await scrapeMaker.doWaitFor(3000);
          // for loop
          const horsenums: number[] = [...Array(18)].map((_, i) => i + 1);
          // elements
          const elementCount = await scrapeMaker.doGetLength('.OikiriDataHead1');
          // loop each horses
          for (const i of horsenums) {
            try {
              // switch on language
              if (language == 'japanese') {
                // set finish message
                statusmessage = `${targetCourseName} 調教取得中...`;
              } else {
                // set finish message
                statusmessage = `Getting ${targetCourseName} Training...`;
              }
              // URL
              event.sender.send('statusUpdate', {
                status: statusmessage,
                target: `${String(j)}R`
              });
              // empty array
              let tmpObj: { [key: string]: string } = {
                race: '', // race
                horse: '', // horse name
                date: '', // date
                place: '', // training center
                condition: '', // field condition
                strength: '', // training strength
                review: '', // review comment
                lap1: '', // lap time
                lap2: '', // lap time
                lap3: '', // lap time
                lap4: '', // lap time
                lap5: '', // lap time
                color1: '', // training color
                color2: '', // training color
                color3: '', // training color
                color4: '', // training color
                color5: '', // training color
              };
              await scrapeMaker.doWaitFor(1000);
              // no element break
              if (!await scrapeMaker.doCheckSelector(`.OikiriDataHead${i} .Horse_Info .Horse_Name a`)) {
                break;
              }

              // if multiple
              if (elementCount > 1) {
                logger.debug("multiple mode");
                // no
                const tmpNo: number = i * 2 + 1;
                // get data
                postArray = await Promise.all([
                  // race no
                  String(j),
                  // horse name
                  scrapeMaker.doSingleEval(`.OikiriDataHead${i} .Horse_Info .Horse_Name a`, 'innerHTML'),
                  // date
                  scrapeMaker.doSingleEval(`.OikiriDataHead1:nth-child(${tmpNo}) .Training_Day`, 'innerHTML'),
                  // place
                  (await scrapeMaker.doSingleEval(`.OikiriDataHead1:nth-child(${tmpNo}) td:nth-child(6)`, 'innerHTML')).replace(/<\/?[^>]+>/gi, '').replace('一番時計', ''),
                  // condition
                  scrapeMaker.doSingleEval(`.OikiriDataHead1:nth-child(${tmpNo}) td:nth-child(7)`, 'innerHTML'),
                  // training strength
                  scrapeMaker.doSingleEval(`.OikiriDataHead1:nth-child(${tmpNo}) .TrainingLoad`, 'innerHTML'),
                  // training review
                  scrapeMaker.doSingleEval(`.OikiriDataHead1:nth-child(${tmpNo}) .Training_Critic`, 'innerHTML'),
                  // rap time
                  scrapeMaker.doMultiEval(`.OikiriDataHead1:nth-child(${tmpNo}) .TrainingTimeData .TrainingTimeDataList li .RapTime`, 'innerHTML'),
                  // cell color
                  scrapeMaker.doMultiEval(`.OikiriDataHead1:nth-child(${tmpNo}) .TrainingTimeData .TrainingTimeDataList li`, 'className'),
                ]);

              } else {
                logger.debug("single mode");
                // get data
                postArray = await Promise.all([
                  // race no
                  String(j),
                  // horse name
                  scrapeMaker.doSingleEval(`.OikiriDataHead${i} .Horse_Info .Horse_Name a`, 'innerHTML'),
                  // date
                  scrapeMaker.doSingleEval(`.OikiriDataHead${i} .Training_Day`, 'innerHTML'),
                  // place
                  (await scrapeMaker.doSingleEval(`.OikiriDataHead${i} td:nth-child(6)`, 'innerHTML')).replace(/<\/?[^>]+>/gi, '').replace('一番時計', ''),
                  // condition
                  scrapeMaker.doSingleEval(`.OikiriDataHead${i} td:nth-child(7)`, 'innerHTML'),
                  // training strength
                  scrapeMaker.doSingleEval(`.OikiriDataHead${i} .TrainingLoad`, 'innerHTML'),
                  // training review
                  scrapeMaker.doSingleEval(`.OikiriDataHead${i} .Training_Critic`, 'innerHTML'),
                  // rap time
                  scrapeMaker.doMultiEval(`.OikiriDataHead${i} .TrainingTimeData .TrainingTimeDataList li .RapTime`, 'innerHTML'),
                  // cell color
                  scrapeMaker.doMultiEval(`.OikiriDataHead${i} .TrainingTimeData .TrainingTimeDataList li`, 'className'),
                ]);
              }
              // not empty
              if (postArray.length > 0) {
                // set each value
                tmpObj.race = postArray[0];
                tmpObj.horse = postArray[1];
                tmpObj.date = postArray[2];
                tmpObj.place = isNaN(postArray[3]) ? postArray[3] : '';
                tmpObj.condition = postArray[4];
                tmpObj.strength = postArray[5];
                tmpObj.review = postArray[6];
                tmpObj.lap1 = postArray[7][0];
                tmpObj.lap2 = postArray[7][1];
                tmpObj.lap3 = postArray[7][2];
                tmpObj.lap4 = postArray[7][3];
                tmpObj.lap5 = postArray[7][4];
                tmpObj.color1 = postArray[8][0];
                tmpObj.color2 = postArray[8][1];
                tmpObj.color3 = postArray[8][2];
                tmpObj.color4 = postArray[8][3];
                tmpObj.color5 = postArray[8][4];
                // set to json
                tmpJsonArray.push(tmpObj);

              } else {
                // set empty to json
                tmpJsonArray.push(tmpObj);
              }

            } catch (err: unknown) {
              logger.error(err);
              break;
            }
          }
          // increment success counter
          successCounter++;
          // add resut jsons
          finalJsonArray.push(tmpJsonArray);

        } catch (error: unknown) {
          // error
          logger.error(error);
          // increment fail counter
          failCounter++;

        } finally {
          // send success
          event.sender.send('success', successCounter);
          // send fail
          event.sender.send('fail', failCounter);
        }
      }
      // formattedDate
      const formattedDate: string = 'training_' + date;
      // file path
      const tmpFilePath: string = path.join(dir_desktop, formattedDate);
      // csv filename
      const filePath: string = `${tmpFilePath}_${targetCourseName}.csv`;
      // write data
      await csvMaker.makeCsvData(finalJsonArray.flat(), trainingColumns, filePath);
      logger.info(`csv completed.`);
      await scrapeMaker.doWaitFor(1500);
    }
    // switch on language
    if (language == 'japanese') {
      // set finish message
      endmessage = '完了しました。';
    } else {
      // set finish message
      endmessage = 'completed';
    }
    // end message
    dialogMaker.showmessage('info', endmessage);

  } catch (e: unknown) {
    logger.error(e);
    // error
    if (e instanceof Error) {
      // error message
      dialogMaker.showmessage('error', e.message);
    }
  }
});

// post communication
const httpsPost = async (
  hostname: string,
  data: any,
): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    // post
    axios
      .post(hostname, data, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then((response: any) => {
        // data
        const targetData: any = response.data;

        // recieved data
        if (targetData != 'error') {
          // complete
          resolve(targetData);
        } else {
          // error
          throw new Error('data is invalid');
        }
      })
      .catch((err: unknown) => {
        logger.error(err);
        // error
        if (err instanceof Error) {
          // error message
          dialogMaker.showmessage('error', err.message);
          // reject
          reject('httpsPost error');
        }
      });
  });
};

// get now date
const getNowDate = (): string => {
  // get now time
  return new Date().toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replaceAll('/', '-');
}
