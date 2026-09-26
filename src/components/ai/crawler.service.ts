import { Injectable } from '@nestjs/common';
import axios from 'axios';
import cheerio from 'cheerio';
import puppeteer from 'puppeteer';

@Injectable()
export class CrawlerService {
  async crawlURL(url: string): Promise<string> {
    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });
      const content = await page.content();
      await browser.close();

      const $ = cheerio.load(content);
      $('script, style').remove(); // Remove unnecessary tags
      return $('body').text();
    } catch (error) {
      throw new Error(`Failed to crawl URL: ${error.message}`);
    }
  }

  async crawlNestedURLs(baseURL: string): Promise<{ text: string; metadata: any }[]> {
    const visitedURLs = new Set<string>();
    const queue = [baseURL];
    const allContent: { text: string; metadata: any }[] = [];

    while (queue.length > 0) {
      const currentURL = queue.shift();
      if (!currentURL || visitedURLs.has(currentURL)) continue;

      visitedURLs.add(currentURL);
      const content = await this.crawlURL(currentURL);
      allContent.push({ text: content, metadata: { url: currentURL } });

      // Extract nested URLs
      const response = await axios.get(currentURL);
      const $ = cheerio.load(response.data);
      $('a').each((_, element) => {
        const href = $(element).attr('href');
        if (href && href.startsWith(baseURL)) {
          queue.push(href);
        }
      });
    }

    return allContent;
  }
}