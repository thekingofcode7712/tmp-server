import axios from 'axios';

export interface FilterRule {
  pattern: string;
  type: 'block' | 'hide' | 'exception';
  isRegex: boolean;
}

/**
 * Parse EasyList/EasyPrivacy filter format into structured rules
 */
export function parseFilterList(filterText: string): FilterRule[] {
  const rules: FilterRule[] = [];
  const lines = filterText.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('!') || trimmed.startsWith('[')) {
      continue;
    }

    // Exception rules (@@)
    if (trimmed.startsWith('@@')) {
      rules.push({
        pattern: trimmed.substring(2),
        type: 'exception',
        isRegex: trimmed.includes('*') || trimmed.includes('^'),
      });
      continue;
    }

    // Element hiding rules (##)
    if (trimmed.includes('##')) {
      const [domain, selector] = trimmed.split('##');
      rules.push({
        pattern: selector,
        type: 'hide',
        isRegex: false,
      });
      continue;
    }

    // URL blocking rules
    rules.push({
      pattern: trimmed,
      type: 'block',
      isRegex: trimmed.includes('*') || trimmed.includes('^'),
    });
  }

  return rules;
}

/**
 * Fetch and parse filter list from URL
 */
export async function fetchFilterList(url: string): Promise<FilterRule[]> {
  try {
    const response = await axios.get(url, { timeout: 30000 });
    return parseFilterList(response.data);
  } catch (error: any) {
    throw new Error(`Failed to fetch filter list: ${error.message}`);
  }
}

/**
 * Check if URL should be blocked based on filter rules
 */
export function shouldBlockUrl(url: string, rules: FilterRule[]): boolean {
  for (const rule of rules) {
    if (rule.type === 'exception') {
      if (matchesPattern(url, rule.pattern, rule.isRegex)) {
        return false; // Exception rule - don't block
      }
    }
  }

  for (const rule of rules) {
    if (rule.type === 'block') {
      if (matchesPattern(url, rule.pattern, rule.isRegex)) {
        return true; // Block this URL
      }
    }
  }

  return false;
}

/**
 * Get CSS selectors to hide elements
 */
export function getHideSelectors(domain: string, rules: FilterRule[]): string[] {
  const selectors: string[] = [];

  for (const rule of rules) {
    if (rule.type === 'hide') {
      selectors.push(rule.pattern);
    }
  }

  return selectors;
}

/**
 * Match URL against filter pattern
 */
function matchesPattern(url: string, pattern: string, isRegex: boolean): boolean {
  if (!isRegex) {
    return url.includes(pattern);
  }

  try {
    // Convert EasyList pattern to regex
    let regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\^/g, '[^\\w\\d\\-_.%]')
      .replace(/\|/g, '');

    const regex = new RegExp(regexPattern, 'i');
    return regex.test(url);
  } catch (error) {
    // If regex is invalid, fall back to simple string matching
    return url.includes(pattern);
  }
}

/**
 * Common ad/tracker domains (built-in list)
 */
export const COMMON_AD_DOMAINS = [
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'google-analytics.com',
  'facebook.com/tr',
  'connect.facebook.net',
  'ads.twitter.com',
  'analytics.twitter.com',
  'ads.linkedin.com',
  'pixel.adsafeprotected.com',
  'adservice.google.com',
  'pagead2.googlesyndication.com',
  'tpc.googlesyndication.com',
  'googletagservices.com',
  'googletagmanager.com',
  'outbrain.com',
  'taboola.com',
  'scorecardresearch.com',
  'quantserve.com',
  'advertising.com',
  'adnxs.com',
  'rubiconproject.com',
  'pubmatic.com',
  'openx.net',
  'adsrvr.org',
  'criteo.com',
  'amazon-adsystem.com',
];

/**
 * Quick check if URL contains known ad domain
 */
export function isKnownAdDomain(url: string): boolean {
  const urlLower = url.toLowerCase();
  return COMMON_AD_DOMAINS.some(domain => urlLower.includes(domain));
}
