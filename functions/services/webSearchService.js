/**
 * Web Search Service - Free search API integration
 * Uses DuckDuckGo (free, no API key) and Tavily (free tier with API key) as fallback
 * Node 20 has native fetch support
 */

const config = require('../config');

// Allowed domains for academic references
const ALLOWED_DOMAINS = [
  'scholar.google.com',
  'researchgate.net',
  'jstor.org',
  'pubmed.ncbi.nlm.nih.gov',
  'ieeeexplore.ieee.org',
  'bbc.com',
  'theguardian.com',
  'reuters.com',
  'britannica.com',
  '.edu',
  '.ac.uk',
  '.gov'
];

/**
 * Search using DuckDuckGo Instant Answer API (free, no API key required)
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of search results with title, url, snippet
 */
async function searchDuckDuckGo(query) {
  try {
    // DuckDuckGo HTML search (free, no API key)
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    
    // Use DuckDuckGo Instant Answer API for better structured results
    const instantAnswerUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    
    const response = await fetch(instantAnswerUrl);
    const data = await response.json();
    
    const results = [];
    
    // Extract from RelatedTopics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      data.RelatedTopics.forEach(topic => {
        if (topic.FirstURL && topic.Text) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 100),
            url: topic.FirstURL,
            snippet: topic.Text
          });
        }
      });
    }
    
    // Extract from Results
    if (data.Results && Array.isArray(data.Results)) {
      data.Results.forEach(result => {
        results.push({
          title: result.Text || result.FirstURL,
          url: result.FirstURL,
          snippet: result.Text
        });
      });
    }
    
    return results.slice(0, 10); // Limit to 10 results
  } catch (error) {
    console.error('[webSearchService] DuckDuckGo search error:', error);
    return [];
  }
}

/**
 * Search using Tavily API (free tier available, requires API key)
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of search results
 */
async function searchTavily(query) {
  try {
    const tavilyApiKey = config.tavily?.apiKey || process.env.TAVILY_API_KEY;
    
    if (!tavilyApiKey) {
      console.log('[webSearchService] Tavily API key not configured, skipping');
      return [];
    }
    
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: query,
        search_depth: 'basic',
        include_answer: false,
        include_images: false,
        include_raw_content: false,
        max_results: 10
      })
    });
    
    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return (data.results || []).map(result => ({
      title: result.title || '',
      url: result.url || '',
      snippet: result.content || ''
    }));
  } catch (error) {
    console.error('[webSearchService] Tavily search error:', error);
    return [];
  }
}

/**
 * Search using Serper API (free tier available, requires API key)
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of search results
 */
async function searchSerper(query) {
  try {
    const serperApiKey = config.serper?.apiKey || process.env.SERPER_API_KEY;
    
    if (!serperApiKey) {
      console.log('[webSearchService] Serper API key not configured, skipping');
      return [];
    }
    
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': serperApiKey
      },
      body: JSON.stringify({
        q: query,
        num: 10
      })
    });
    
    if (!response.ok) {
      throw new Error(`Serper API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    const results = [];
    
    // Extract organic results
    if (data.organic && Array.isArray(data.organic)) {
      data.organic.forEach(result => {
        results.push({
          title: result.title || '',
          url: result.link || '',
          snippet: result.snippet || ''
        });
      });
    }
    
    return results;
  } catch (error) {
    console.error('[webSearchService] Serper search error:', error);
    return [];
  }
}

/**
 * Main web search function - tries multiple free APIs
 * @param {string} query - Search query
 * @param {Array} preferredDomains - Preferred domains to filter results
 * @returns {Promise<Array>} Array of search results filtered by allowed domains
 */
async function searchWeb(query, preferredDomains = ALLOWED_DOMAINS) {
  try {
    console.log('[webSearchService] Searching web for:', query);
    
    let results = [];
    
    // Try Serper first (best results, free tier available)
    results = await searchSerper(query);
    
    // Fallback to Tavily if Serper fails or returns no results
    if (results.length === 0) {
      console.log('[webSearchService] Trying Tavily as fallback...');
      results = await searchTavily(query);
    }
    
    // Fallback to DuckDuckGo if both fail (always available, no API key)
    if (results.length === 0) {
      console.log('[webSearchService] Trying DuckDuckGo as fallback...');
      results = await searchDuckDuckGo(query);
    }
    
    // Filter results by allowed domains
    const filteredResults = results.filter(result => {
      if (!result.url) return false;
      
      const url = result.url.toLowerCase();
      return preferredDomains.some(domain => {
        if (domain.startsWith('.')) {
          // Domain extension match (.edu, .gov, etc.)
          return url.includes(domain);
        }
        return url.includes(domain.toLowerCase());
      });
    });
    
    // If we have filtered results, return them; otherwise return all results
    const finalResults = filteredResults.length > 0 ? filteredResults : results;
    
    console.log(`[webSearchService] Found ${finalResults.length} results (${filteredResults.length} from allowed domains)`);
    
    return finalResults.slice(0, 15); // Limit to 15 results
  } catch (error) {
    console.error('[webSearchService] Web search error:', error);
    return [];
  }
}

/**
 * Search specifically for academic references
 * @param {string} topic - Assignment topic
 * @param {string} studentOpinion - Optional student opinion for context
 * @returns {Promise<Array>} Array of academic references
 */
async function searchAcademicReferences(topic, studentOpinion = '') {
  try {
    // Build search queries targeting academic sources
    const queries = [
      `${topic} site:scholar.google.com`,
      `${topic} site:researchgate.net`,
      `${topic} site:jstor.org`,
      `${topic} site:pubmed.ncbi.nlm.nih.gov`,
      `${topic} ${studentOpinion ? studentOpinion.substring(0, 50) : ''}`
    ];
    
    const allResults = [];
    
    // Search with multiple queries
    for (const query of queries.slice(0, 3)) { // Limit to 3 queries to avoid rate limits
      const results = await searchWeb(query, ALLOWED_DOMAINS);
      allResults.push(...results);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Remove duplicates based on URL
    const uniqueResults = [];
    const seenUrls = new Set();
    
    for (const result of allResults) {
      if (result.url && !seenUrls.has(result.url)) {
        seenUrls.add(result.url);
        uniqueResults.push(result);
      }
    }
    
    return uniqueResults.slice(0, 10); // Return top 10 unique results
  } catch (error) {
    console.error('[webSearchService] Academic reference search error:', error);
    return [];
  }
}

module.exports = {
  searchWeb,
  searchAcademicReferences,
  ALLOWED_DOMAINS
};

