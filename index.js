const vanillaPuppeteer = require('puppeteer');
const {
    addExtra
} = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
const fs = require("fs");
const json2csv = require("json2csv");

(async () => {
    const puppeteer = addExtra(vanillaPuppeteer)

    puppeteer.use(StealthPlugin())
    puppeteer.use(AdblockerPlugin())

    const browser = await puppeteer.launch({
        executablePath: 'C:/REPLACE/YOUR_LOCAL_PATH/node_modules/puppeteer/.local-chromium/win64-856583/chrome-win/chrome.exe',
        args: ['--no-sandbox'],
        headless: true
    });

    const page = await browser.newPage();

    await page.goto("https://www.mudah.my/malaysia/cars-for-sale", {
        waitUntil: 'networkidle0'
    });

    const postLinks = await page.evaluate(() => {
        let data = [];
        const postTitle = document.querySelectorAll("#__next > div.mw13.mw4 > div:nth-child(5) > div:first-child > div > div:nth-child(1) > div a");

        // Extract url and name from each category selector
        postTitle.forEach(element => {
            data.push(element.href);
        });

        return data;
    });

    const posts = [];

    // Extract detail 
    for (link of postLinks) {
        await page.goto(link, {
            waitUntil: 'networkidle0'
        });

        const extractedData = await page.evaluate(() => {
            const descriptionElement = document.querySelector("#__next > div:nth-child(7) > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > ul:nth-child(2) > li:nth-child(1) > div:nth-child(1) > div:nth-child(1)");

            const titleElement = document.querySelector("#__next > div:nth-child(7) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > h1")

            const priceElement = document.querySelector("#__next > div:nth-child(7) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > meta:nth-child(2)");

            const locationElement = document.querySelector("#__next > div:nth-child(7) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2)")

            return {
                title: titleElement ? titleElement.innerHTML : null,
                description: descriptionElement ? descriptionElement.innerHTML : null,
                price: priceElement ? priceElement.getAttribute("content") : null,
                location: locationElement ? locationElement.innerHTML : null
            };
        });

        posts.push({
            url: link,
            description: extractedData.description,
            title: extractedData.title,
            price: extractedData.price,
            location: extractedData.location
        })
    }

    json2csv
        .parseAsync(posts, {
            fields: ['url', 'description', 'title', 'price', 'location']
        })
        .then(csv => {
            fs.writeFile('posts.csv', csv, function (err) {
                if (err) throw err;
                console.log('Done!');
            });
        })

    await browser.close();
})()