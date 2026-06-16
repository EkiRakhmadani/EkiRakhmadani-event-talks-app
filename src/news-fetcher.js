import { XMLParser } from 'fast-xml-parser';

// Topic mapping to Google News RSS Topic IDs
const TOPICS = {
  world: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0Zsd1JkR2x2K0IBFggoRG9XUjBOSVlXTnlaV3FvQVFAA',
  us: 'CAAqIggKIhxDQkFTRHdvSkwyMHZNRGxqTkhnd0Zsd1JkR0VvQUFAA',
  nation: 'CAAqIggKIhxDQkFTRHdvSkwyMHZNRGxqTkhnd0Zsd1JkR0VvQUFAA',
  business: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdnd0Zsd1JkR2x2K0IBFggoRG9XUjBOSVlXTnlaV3FvQVFAA',
  technology: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRE55TXpjU0Zsd1JkR2x2K0IBFggoRG9XUjBOSVlXTnlaV3FvQVFAA',
  tech: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRE55TXpjU0Zsd1JkR2x2K0IBFggoRG9XUjBOSVlXTnlaV3FvQVFAA',
  entertainment: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0Zsd1JkR2x2K0IBFggoRG9XUjBOSVlXTnlaV3FvQVFAA',
  sports: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNREU1TXpRU0Zsd1JkR2x2K0IBFggoRG9XUjBOSVlXTnlaV3FvQVFAA',
  science: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0Zsd1JkR2x2K0IBFggoRG9XUjBOSVlXTnlaV3FvQVFAA',
  health: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNR3d5TmpVUGZsd1JkR2x2K0IBFggoRG9XUjBOSVlXTnlaV3FvQVFAA'
};

const BASE_URL = 'https://news.google.com/rss';

/**
 * Fetches and parses an RSS feed from Google News
 * @param {string} url - The RSS Feed URL
 * @returns {Promise<Array>} List of formatted article objects
 */
async function fetchAndParse(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch news (HTTP status: ${response.status})`);
    }
    const xmlData = await response.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: ''
    });

    const jsonObj = parser.parse(xmlData);
    
    if (!jsonObj.rss || !jsonObj.rss.channel) {
      throw new Error('Invalid RSS feed format received from Google News');
    }

    const channel = jsonObj.rss.channel;
    const rawItems = channel.item;

    if (!rawItems) {
      return [];
    }

    // fast-xml-parser returns an object if there's only 1 item, or an array if there are multiple.
    const items = Array.isArray(rawItems) ? rawItems : [rawItems];

    return items.map(item => {
      // Safely extract source name
      let sourceName = 'Google News';
      if (item.source) {
        if (typeof item.source === 'object') {
          sourceName = item.source['#text'] || item.source.name || 'Unknown Source';
        } else if (typeof item.source === 'string') {
          sourceName = item.source;
        }
      }

      // Clean up title (remove trailing " - Source Name")
      let title = item.title || 'No Title';
      const suffix = ` - ${sourceName}`;
      if (title.endsWith(suffix)) {
        title = title.substring(0, title.length - suffix.length);
      }

      return {
        title,
        link: item.link || '',
        pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
        source: sourceName,
        sourceUrl: typeof item.source === 'object' ? item.source.url : ''
      };
    });
  } catch (error) {
    throw new Error(`Error loading news: ${error.message}`);
  }
}

/**
 * Fetches the top news articles
 * @returns {Promise<Array>}
 */
export async function getTopNews() {
  const url = `${BASE_URL}?hl=en-US&gl=US&ceid=US:en`;
  return fetchAndParse(url);
}

/**
 * Fetches articles matching a search query
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function getSearchNews(query) {
  const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  return fetchAndParse(url);
}

/**
 * Fetches articles for a specific topic
 * @param {string} topic - Topic name (e.g. 'tech', 'science')
 * @returns {Promise<Array>}
 */
export async function getTopicNews(topic) {
  const normalizedTopic = topic.toLowerCase().trim();
  const topicId = TOPICS[normalizedTopic];

  if (!topicId) {
    const supported = Object.keys(TOPICS).filter((v, i, a) => a.indexOf(v) === i).join(', ');
    throw new Error(`Unsupported topic "${topic}". Supported topics are: ${supported}`);
  }

  const url = `${BASE_URL}/topics/${topicId}?hl=en-US&gl=US&ceid=US:en`;
  return fetchAndParse(url);
}

/**
 * Helper to get all supported topics
 * @returns {Array<string>}
 */
export function getSupportedTopics() {
  return Array.from(new Set(Object.keys(TOPICS)));
}
