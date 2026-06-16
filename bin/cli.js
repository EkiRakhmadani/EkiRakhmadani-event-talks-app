#!/usr/bin/env node

import { getTopNews, getSearchNews, getTopicNews, getSupportedTopics } from '../src/news-fetcher.js';
import { renderHeader, renderArticle, renderHelp, renderError } from '../src/formatter.js';

async function main() {
  const args = process.argv.slice(2);

  // 1. Check for Help Option
  if (args.includes('-h') || args.includes('--help')) {
    renderHelp(getSupportedTopics());
    process.exit(0);
  }

  // 2. Parse and Remove Limit Option
  let limit = 10;
  const limitIndex = args.findIndex(arg => arg === '-l' || arg === '--limit');
  if (limitIndex !== -1) {
    if (limitIndex + 1 < args.length) {
      const val = parseInt(args[limitIndex + 1], 10);
      if (isNaN(val) || val <= 0) {
        renderError('Limit option must be a positive number.');
        process.exit(1);
      }
      limit = Math.min(val, 50); // Cap at 50 to avoid flooding the terminal
      args.splice(limitIndex, 2);
    } else {
      renderError('Option -l/--limit requires a value.');
      process.exit(1);
    }
  }

  // 3. Process Command
  try {
    let articles = [];
    let title = '';
    let subtitle = '';

    if (args.length === 0) {
      // Default: Top stories
      title = 'GOOGLE NEWS - TOP STORIES';
      subtitle = 'Latest national and international news';
      articles = await getTopNews();
    } else {
      const command = args[0].toLowerCase();
      
      if (command === 'search') {
        const query = args.slice(1).join(' ').trim();
        if (!query) {
          throw new Error('Search query is required. Example: google-news search "artificial intelligence"');
        }
        title = 'GOOGLE NEWS - SEARCH RESULTS';
        subtitle = `Search: "${query}"`;
        articles = await getSearchNews(query);
      } else if (command === 'topic') {
        const topic = args[1];
        if (!topic) {
          const supported = getSupportedTopics().join(', ');
          throw new Error(`Topic name is required. Supported topics: ${supported}`);
        }
        title = `GOOGLE NEWS - ${topic.toUpperCase()}`;
        subtitle = `Category: ${topic.toLowerCase()}`;
        articles = await getTopicNews(topic);
      } else {
        throw new Error(`Unknown command "${args[0]}". Run with --help to see all available commands.`);
      }
    }

    // 4. Render Articles
    if (articles.length === 0) {
      renderHeader(title, subtitle);
      console.log('  No articles found.');
      console.log();
      return;
    }

    const displayCount = Math.min(articles.length, limit);
    renderHeader(title, `${subtitle} (Showing top ${displayCount} of ${articles.length} items)`);

    for (let i = 0; i < displayCount; i++) {
      renderArticle(articles[i], i);
    }
  } catch (error) {
    renderError(error.message);
    process.exit(1);
  }
}

main();
