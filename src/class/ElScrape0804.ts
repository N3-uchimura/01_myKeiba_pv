/**
 * ElScrape.ts
 *
 * class：ElScrape
 * function：scraping site
 * updated: 2025/08/18
 **/

'use strict';

// define modules
import { setTimeout } from 'node:timers/promises'; // wait for seconds
import puppeteer from 'puppeteer'; // Puppeteer for scraping
import fetch from 'cross-fetch'; // required 'fetch'
import { PuppeteerBlocker } from '@ghostery/adblocker-puppeteer';

//* Interfaces
// puppeteer options
interface puppOption {
  headless: boolean; // display mode
  ignoreDefaultArgs: string[]; // ignore extensions
  args: string[]; // args
}

// class
export class Scrape {
  static adblock: boolean; // adblock flg
  static logger: any; // logger
  static browser: any; // static browser
  static page: any; // static page
  static pages: any[]; // static page
  private _result: boolean; // scrape result

  // constractor
  constructor(logger: any) {
    // loggeer instance
    Scrape.logger = logger;
    // result
    this._result = false;
    Scrape.logger.silly('scrape: constructed');
  }

  // initialize
  init(flg: boolean = false): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.silly('scrape: initialize mode.');
        // loggeer instance
        Scrape.adblock = flg;
        // pupp option
        const puppOptions: puppOption = {
          headless: true, // no display mode
          ignoreDefaultArgs: [], // ignore extensions
          args: [], // args
        };
        // lauch browser
        Scrape.browser = await puppeteer.launch(puppOptions);
        // get all tabs
        Scrape.page = (await Scrape.browser.pages())[0];

        // use adblock
        if (Scrape.adblock) {
          Scrape.logger.silly('scrape: adblock mode.');
          // set adblock
          PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
            Scrape.logger.silly('scrape: adblock finished.');
            blocker.enableBlockingInPage(Scrape.page);
          });
        }

        // set viewport
        Scrape.page.setViewport({
          width: 1920,
          height: 1000,
        });
        // mimic agent
        await Scrape.page.setUserAgent(generateRandomUA());
        Scrape.logger.silly('scrape: initialize finished.');
        // resolved
        resolve();

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // get page url
  getUrl(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.silly('scrape: getUrl mode.');
        // resolved
        resolve(await Scrape.page.url());

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        reject('error');
      }
    });
  }

  // get page title
  getTitle(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.silly('scrape: getTitle mode.');
        // resolved
        resolve(await Scrape.page.title);

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        reject('error');
      }
    });
  }

  // get a href
  getHref(elem: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.silly('scrape: getHref mode.');
        // resolved
        resolve(await Scrape.page.$eval(elem, (elm: any) => elm.href));

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        reject('error');
      }
    });
  }

  // press enter
  pressEnter(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.silly('scrape: pressEnter mode.');
        // press enter key
        await Scrape.page.keyboard.press('Enter');
        // resolved
        resolve();

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // go page
  doGo(targetPage: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.silly('scrape: doGo mode.');
        // goto target page
        Scrape.logger.silly(targetPage);
        await Scrape.page.goto(targetPage);
        // resolved
        resolve();

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // goback
  doGoBack(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.silly('scrape: doGoBack mode.');
        // go back
        await Scrape.page.goBack();
        // resolved
        resolve();

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // click
  doClick(elem: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.silly('scrape: doClick mode.');
        // click target element
        await Scrape.page.$$eval(elem, (elements: any) => elements[0].click());
        // resolved
        resolve();

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // type
  doType(elem: string, value: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.silly('scrape: doType mode.');
        // type element on specified value
        await Scrape.page.type(elem, value, { delay: 100 });
        // resolved
        resolve();

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // clear
  doClear(elem: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.silly('scrape: doClear mode.');
        // clear the textbox
        await Scrape.page.$eval(elem, (element: any) => (element.value = ''));
        // resolved
        resolve();

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // select
  doSelect(elem: string, value: any): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.silly('scrape: doSelect mode.');
        // wait for load
        await Promise.all([
          // select dropdown element
          Scrape.page.select(elem, value),
          // wait for time
          this.doWaitFor(2000),
        ]);
        Scrape.logger.silly('scrape: doSelect finished.');
        // resolved
        resolve();

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // screenshot
  doScreenshot(path: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.silly('scrape: doScreenshot mode.');
        // take screenshot of window
        await Scrape.page.screenshot({ path: path });
        // resolved
        resolve();

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // eval
  doSingleEval(selector: string, property: string): Promise<string> {
    return new Promise(async (resolve, _) => {
      try {
        // target item
        const exists: boolean = await Scrape.page.$eval(selector, () => true).catch(() => false);

        // no result
        if (!exists) {
          Scrape.logger.silly('not exists');
          resolve('');

        } else {
          // target value
          const item: any = await Scrape.page.$(selector);

          // if not null
          if (item !== null) {
            // got data
            const data: string = await (
              await item.getProperty(property)
            ).jsonValue();

            // if got data not null
            if (data) {
              // resolved
              resolve(data);

            } else {
              resolve('');
            }

          } else {
            resolve('');
          }
        }

      } catch (e: unknown) {
        Scrape.logger.error(e);
        resolve('error');
      }
    });
  }

  // eval
  doMultiEval(selector: string, property: string): Promise<string[]> {
    return new Promise(async (resolve, reject) => {
      try {
        //Scrape.logger.silly('scrape: doMultiEval mode.');
        // data set
        let datas: string[] = [];
        // target list
        const list: any = await Scrape.page.$$(selector);
        // result
        const result: boolean = await Scrape.page.$(selector).then((res: any) => !!res);

        // if element exists
        if (result) {
          // loop in list
          for (const ls of list) {
            // push to data set
            datas.push(await (await ls.getProperty(property)).jsonValue());
          }
          // resolved
          resolve(datas);
        } else {
          resolve([]);
        }

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        resolve([]);
      }
    });
  }

  // waitSelector
  doWaitFor(time: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        //Scrape.logger.silly('scrape: doWaitFor mode.');
        // wait for time
        await setTimeout(time);
        resolve();

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // waitSelector
  doWaitSelector(elem: string, time: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.silly('scrape: doWaitSelector mode.');
        // target item
        const exists: boolean = await Scrape.page.$eval(elem, () => true).catch(() => false);

        // if element exists
        if (exists) {
          // wait for loading selector
          await Scrape.page.waitForSelector(elem, { timeout: time });
          // resolved
          resolve();
        }

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // wait for navigaion
  doWaitForNav(time: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.silly('scrape: doWaitForNav mode.');
        // wait for time
        await Scrape.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: time });
        resolve();

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // check Selector
  doCheckSelector(elem: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        //Scrape.logger.silly('scrape: doCheckSelector mode.');
        // target item
        const exists: boolean = await Scrape.page.$eval(elem, () => true).catch(() => false);
        // return true/false
        resolve(exists);

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        reject(false);
      }
    });
  }

  // close window
  doClose(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.silly('scrape: doClose mode.');
        // close browser
        await Scrape.browser.close();
        // close page
        await Scrape.page.close();
        // resolved
        resolve();

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // reload
  doReload(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        Scrape.logger.silly('scrape: doReload mode.');
        // close browser
        await Scrape.page.reload();
        // resolved
        resolve();

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        reject();
      }
    });
  }

  // get length
  doGetLength(elem: string): Promise<number> {
    return new Promise(async (resolve, _) => {
      try {
        Scrape.logger.silly('scrape: doGetLength mode.');
        // resolved
        resolve((await Scrape.page.$$(elem)).length);

      } catch (e: unknown) {
        Scrape.logger.error(e);
        // reject
        resolve(0);
      }
    });
  }

  // set result
  set setSucceed(selector: string) {
    // Do something with val that takes time
    this._result = Scrape.page.$(selector).then((res: any) => !!res);
  }

  // get result
  get getSucceed(): boolean {
    return this._result;
  }
}

// get random ua
const generateRandomUA = (): string => {
  // Array of random user agents
  const userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3864.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:62.0) Gecko/20100101 Firefox/62.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:67.0) Gecko/20100101 Firefox/67.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:68.0) Gecko/20100101 Firefox/68.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:61.0) Gecko/20100101 Firefox/61.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:62.0) Gecko/20100101 Firefox/62.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/17.17134',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36 Edg/94.0.992.31',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Safari/605.1.15'
  ];
  // Get a random index based on the length of the user agents array 
  const randomUAIndex = Math.floor(Math.random() * userAgents.length);
  // Return a random user agent using the index above
  return userAgents[randomUAIndex];
}