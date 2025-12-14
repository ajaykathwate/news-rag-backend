import Parser from 'rss-parser';
import axios from "axios";
import * as cheerio from "cheerio";
import { Article } from "../types";

const parser = new Parser();

const scrapeContent = async (url: string): Promise<string> => {
  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 5000,
    });
    const $ = cheerio.load(data);

    // Select paragraphs from common article containers
    const selectors = [
      "article",
      ".article-body",
      ".story-body",
      ".main-content",
      "main",
    ];
    let content = "";

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        // Get text from p tags inside the container
        content = element
          .find("p")
          .map((_, el) => $(el).text())
          .get()
          .join("\n\n");
        break;
      }
    }

    // Fallback: just grab all p tags if no container found
    if (!content) {
      content = $("p")
        .map((_, el) => $(el).text())
        .get()
        .join("\n\n");
    }

    return content;
  } catch (error) {
    console.warn(`Failed to scrape ${url}`);
    return "";
  }
};

export const fetchRssFeed = async (
  url: string,
  sourceName: string
): Promise<Article[]> => {
  try {
    const feed = await parser.parseURL(url);
    const articles: Article[] = [];

    // Limit to 10 recent articles per feed to avoid hitting rate limits during scraping
    const items = feed.items.slice(0, 15);

    for (const item of items) {
      let content = item.contentSnippet || item.content || "";

      if (item.link) {
        console.log(`Scraping ${item.link}...`);
        const scraped = await scrapeContent(item.link);
        if (scraped.length > content.length) {
          content = scraped;
        }
      }

      // Skip if content is too short
      if (content.length < 200) continue;

      articles.push({
        title: item.title || "No Title",
        link: item.link || "",
        content,
        pubDate: item.pubDate,
        source: sourceName,
      });

      // Polite delay
      await new Promise((r) => setTimeout(r, 500));
    }

    return articles;
  } catch (error) {
    console.error(`Error fetching RSS feed from ${url}:`, error);
    return [];
  }
};
