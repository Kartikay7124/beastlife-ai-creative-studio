export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface PageContent {
  title: string;
  url: string;
  domain: string;
  content: string;
}

export interface ResearchProvider {
  name: "live" | "fixture";
  searchWeb(query: string): Promise<SearchResult[]>;
  readPage(url: string): Promise<PageContent>;
}
