const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        devtools: true,
        timeout: 60 * 1000,
    });

    const pages = await browser.pages();
    const page = pages.length ? pages[0] : await browser.newPage();
    page.setViewport({width: 1440, height: 900});
    await page.goto('http://zu.sh.fang.com/');
    const numPages = await getNumPages(page);
    console.log('开始抓取第1页数据...')
    let houses = await getHouses(page);
    for (let pageNum = 2; pageNum <= numPages; pageNum++) {
        await page.goto(`http://zu.sh.fang.com/house/i3${pageNum}/`);
        console.log(`开始抓取第${pageNum}页数据...`);
        const data = await getHouses(page);
        houses = houses.concat(data);
    }
    console.log(houses);
    console.log('共计', houses.length, '条房源信息');
    browser.close();
})();

async function getNumPages(page) {
    const PAGINATION_TOTAL_SELECTOR = 'div.fanye > span.txt';
    return await page.evaluate((sel) => {
        const txt = document.querySelector(sel).innerText;
        return Number(txt.match(/\d+/)[0]);
    }, PAGINATION_TOTAL_SELECTOR);
}

async function getHouses(page) {
    const LENGTH_SELECTOR_TAG = 'list';

    return await page.evaluate((sel) => {
        const getNodeValue = node => node ? node.nodeValue.match(/[\u4e00-\u9fa5_a-zA-Z0-9]+/)[0] : ''; 
        const elementCollections = document.getElementsByClassName(sel);

        return Array.prototype.slice.call(elementCollections).map(element => {
            const img = element.querySelector('dt > a > img').getAttribute('data-src');
            const title = element.querySelector('dd > p.title > a').getAttribute('title');
            const price = element.querySelector('dd > div.moreInfo > p > span').innerHTML;
            
            const detailNodes = element.querySelector('dd > p:nth-child(2)').childNodes;
            const detail = {
                rentType: getNodeValue(detailNodes[0]),
                houseType: getNodeValue(detailNodes[2]),
                houseSize: getNodeValue(detailNodes[4]),
                houseDirection: getNodeValue(detailNodes[6]),
            };

            const districtElement = element.querySelector('dd > p > a:nth-child(1) > span');
            const district = districtElement ? districtElement.innerText : '';

            const streetElement = element.querySelector('dd > p > a:nth-child(2) > span');
            const street = streetElement ? streetElement.innerText : '';
            
            const communityElement = element.querySelector('dd > p > a:nth-child(3) > span');
            const community = communityElement ? communityElement.innerText : '';
            
            const trafficElement = element.querySelector('dd > div:nth-child(4) > p > span.subInfor');
            const trafficInfo = trafficElement ? trafficElement.innerText : '';
            console.log(trafficInfo);
            
            const address = { district, street, community, trafficInfo };
            
            return {
                img,
                title,
                price,
                detail,
                address
            }
        });
    }, LENGTH_SELECTOR_TAG);
}