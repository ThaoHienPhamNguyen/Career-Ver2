import { getRequiredEnv } from "./env";

export interface SearchResultItem {
  title: string;
  url: string;
  content: string;
}

export interface SearchTavilyOptions {
  /** Restrict results to these domains only (Tavily include_domains_mode: "filter"). */
  includeDomains?: string[];
  /** Drop results published before this date (YYYY-MM-DD). */
  startDate?: string;
  /**
   * Request the full scraped page text instead of Tavily's short AI-generated
   * snippet. Useful when the snippet is too short to include things like a
   * quote's author attribution, which usually appears near the top of the
   * article. The returned content is truncated (see RAW_CONTENT_MAX_CHARS)
   * to keep prompt size bounded; falls back to the short snippet if Tavily
   * doesn't return raw_content for a result.
   */
  includeRawContent?: boolean;
}

const RAW_CONTENT_MAX_CHARS = 3000;

export async function searchTavily(
  query: string,
  options?: SearchTavilyOptions
): Promise<SearchResultItem[]> {
  const apiKey = getRequiredEnv("TAVILY_API_KEY");
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: 5,
      search_depth: "advanced",
      ...(options?.includeDomains && {
        include_domains: options.includeDomains,
        include_domains_mode: "filter",
      }),
      ...(options?.startDate && {
        start_date: options.startDate,
        filter_by_published_date: true,
      }),
      ...(options?.includeRawContent && { include_raw_content: "text" }),
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    results: Array<{ title: string; url: string; content: string; raw_content?: string }>;
  };
  return data.results.map((r) => ({
    title: r.title,
    url: r.url,
    content:
      options?.includeRawContent && r.raw_content
        ? r.raw_content.slice(0, RAW_CONTENT_MAX_CHARS)
        : r.content,
  }));
}
