const ESC = '\x1b[';
const style = {
  reset: `${ESC}0m`,
  bold: `${ESC}1m`,
  dim: `${ESC}2m`,
  italic: `${ESC}3m`,
  underline: `${ESC}4m`,
  
  cyan: `${ESC}36m`,
  blue: `${ESC}34m`,
  green: `${ESC}32m`,
  yellow: `${ESC}33m`,
  magenta: `${ESC}35m`,
  red: `${ESC}31m`,
  white: `${ESC}37m`,
  brightWhite: `${ESC}97m`,
  gray: `${ESC}90m`
};

const c = {
  reset: (str) => `${style.reset}${str}`,
  bold: (str) => `${style.bold}${str}${style.reset}`,
  dim: (str) => `${style.dim}${str}${style.reset}`,
  italic: (str) => `${style.italic}${str}${style.reset}`,
  underline: (str) => `${style.underline}${str}${style.reset}`,
  cyan: (str) => `${style.cyan}${str}${style.reset}`,
  cyanBold: (str) => `${style.bold}${style.cyan}${str}${style.reset}`,
  blue: (str) => `${style.blue}${str}${style.reset}`,
  blueUnderline: (str) => `${style.underline}${style.blue}${str}${style.reset}`,
  green: (str) => `${style.green}${str}${style.reset}`,
  yellow: (str) => `${style.yellow}${str}${style.reset}`,
  magenta: (str) => `${style.magenta}${str}${style.reset}`,
  magentaBold: (str) => `${style.bold}${style.magenta}${str}${style.reset}`,
  red: (str) => `${style.red}${str}${style.reset}`,
  gray: (str) => `${style.gray}${str}${style.reset}`,
  white: (str) => `${style.white}${str}${style.reset}`,
  brightWhite: (str) => `${style.brightWhite}${str}${style.reset}`,
  brightWhiteBold: (str) => `${style.bold}${style.brightWhite}${str}${style.reset}`
};

/**
 * Formats a Date object to relative time (e.g. "30m ago", "2h ago")
 * @param {Date} date 
 * @returns {string}
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  
  if (isNaN(diffMs)) return 'unknown time';
  
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${diffDays}d ago`;
}

/**
 * Word wraps text to fit within a specific column limit
 * @param {string} text 
 * @param {number} width 
 * @returns {Array<string>}
 */
function wrapText(text, width) {
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length > width) {
      if (currentLine) {
        lines.push(currentLine.trim());
      }
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  }
  
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }
  
  return lines;
}

/**
 * Formats a beautiful header banner for the CLI
 * @param {string} title 
 * @param {string} [subtitle] 
 */
export function renderHeader(title, subtitle) {
  const termWidth = process.stdout.columns || 80;
  const contentWidth = Math.min(termWidth - 4, 76);
  
  const borderTop = '┌' + '─'.repeat(contentWidth + 2) + '┐';
  const borderBottom = '└' + '─'.repeat(contentWidth + 2) + '┘';

  // Centering title
  const rawTitle = title;
  const paddingLeft = Math.floor((contentWidth - rawTitle.length) / 2);
  const paddingRight = contentWidth - rawTitle.length - paddingLeft;
  
  const titleLine = '│ ' + ' '.repeat(paddingLeft) + c.magentaBold(rawTitle) + ' '.repeat(paddingRight) + ' │';
  
  console.log();
  console.log(c.cyan(borderTop));
  console.log(titleLine);
  
  if (subtitle) {
    const cleanSubtitle = subtitle.substring(0, contentWidth);
    const subPaddingLeft = Math.floor((contentWidth - cleanSubtitle.length) / 2);
    const subPaddingRight = contentWidth - cleanSubtitle.length - subPaddingLeft;
    const subtitleLine = '│ ' + ' '.repeat(subPaddingLeft) + c.gray(cleanSubtitle) + ' '.repeat(subPaddingRight) + ' │';
    console.log(subtitleLine);
  }
  
  console.log(c.cyan(borderBottom));
  console.log();
}

/**
 * Formats and prints a single news article to the console
 * @param {Object} article 
 * @param {number} index 
 */
export function renderArticle(article, index) {
  const termWidth = process.stdout.columns || 80;
  
  // Left prefix spacing: "  [01] " is 7 chars.
  const prefix = `  [${String(index + 1).padStart(2, '0')}]  `;
  const indent = '        ';
  const wrapWidth = Math.max(termWidth - 9, 40);

  // Wrap the title
  const titleLines = wrapText(article.title, wrapWidth);

  // Output first line of title with index prefix
  console.log(`${c.cyan(prefix)}${c.brightWhiteBold(titleLines[0])}`);
  
  // Output remaining lines of title with indent
  for (let i = 1; i < titleLines.length; i++) {
    console.log(`${indent}${c.brightWhiteBold(titleLines[i])}`);
  }

  // Output metadata line (source + relative time)
  const relativeTime = formatRelativeTime(article.pubDate);
  const metadata = `${c.cyanBold(article.source)}  •  ${c.gray(relativeTime)}`;
  console.log(`${indent}${metadata}`);

  // Output article link
  if (article.link) {
    console.log(`${indent}${c.blueUnderline(article.link)}`);
  }
  
  console.log(); // Blank line between articles
}

/**
 * Renders the help instructions
 * @param {Array<string>} supportedTopics 
 */
export function renderHelp(supportedTopics) {
  renderHeader('GOOGLE NEWS CLI');
  
  console.log(c.brightWhiteBold('Usage:'));
  console.log(`  ${c.cyan('google-news')} [command] [options]`);
  console.log();
  
  console.log(c.brightWhiteBold('Commands:'));
  console.log(`  ${c.yellow('search "<query>"')}\tSearch Google News for articles matching the query`);
  console.log(`  ${c.yellow('topic <topic_name>')}\tGet news for a specific topic category`);
  console.log();
  
  console.log(c.brightWhiteBold('Options:'));
  console.log(`  ${c.yellow('-l, --limit <num>')}\tLimit the number of news articles shown (default: 10, max: 50)`);
  console.log(`  ${c.yellow('-h, --help')}\t\tShow this help information`);
  console.log();
  
  console.log(c.brightWhiteBold('Supported Topics:'));
  const wrappedTopics = wrapText(supportedTopics.join(', '), 70);
  for (const line of wrappedTopics) {
    console.log(`  ${c.gray(line)}`);
  }
  console.log();
  
  console.log(c.brightWhiteBold('Examples:'));
  console.log(`  ${c.gray('# View the top news stories (default 10 articles)')}`);
  console.log(`  google-news`);
  console.log();
  console.log(`  ${c.gray('# Search for articles about Artificial Intelligence')}`);
  console.log(`  google-news search "artificial intelligence"`);
  console.log();
  console.log(`  ${c.gray('# View the latest 5 science news articles')}`);
  console.log(`  google-news topic science -l 5`);
  console.log();
}

/**
 * Utility to print a styled error message
 * @param {string} msg 
 */
export function renderError(msg) {
  console.error();
  console.error(`  ${c.red('Error:')} ${c.brightWhite(msg)}`);
  console.error();
}
