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
}

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
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    results: Array<{ title: string; url: string; content: string }>;
  };
  return data.results.map((r) => ({ title: r.title, url: r.url, content: r.content }));
}
