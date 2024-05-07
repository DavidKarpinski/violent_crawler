const process = require('process')
const http = require('http')
const https = require('https')
const url = require('url')
const cheerio = require('cheerio')

let toCrawl = []
let crawled = new Set()

const request = url => {
        const options = {
                headers: {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:78.0) Gecko/20100101 Firefox/78.0'}
        }

        return new Promise((resolve, reject) => {
                const parsedUrl = new URL(url)
                const client = parsedUrl.protocol === 'https:' ? https : http

                const req = client.get(url, options, res => {
                        let data = ''
                        res.on('data', chunk => data += chunk)
                        res.on('end', () => resolve(data))
                })

                req.on('error', e => reject(e))
        })
}

const getLinks = (html, baseUrl) => {
        const links = []
        const $ = cheerio.load(html)

        $('a[href]').each((index, element) => {
                const link = $(element).attr('href')
                const absoluteLink = new URL(link, baseUrl).href
                links.push(absoluteLink)
        })

        return links
}

const crawl = async baseUrl => {
        while (toCrawl.length > 0) {
                const url = toCrawl.pop()
                try {
                        const html = await request(url)
                        const links = getLinks(html, baseUrl)

                        links.forEach(link =>{
                                if (!crawled.has(link) && !toCrawl.includes(link))
                                        toCrawl.push(link)
                        })

                        console.log(url)
                        crawled.add(url)
                } catch (e) {
                        console.error(e)
                        crawled.add(url)
                }
        }

        console.log('Done')
}

if (require.main == module) {
        try {
                const url = process.argv[2]
                const baseUrl = url
                if (!url) {
                        console.error(`Usage: ${process.argv[1]} <url>`);
                        process.exit(-1);
                }
                toCrawl.push(url)
                crawl(baseUrl)
        } catch (e) {
                console.error(e)
        }
}
