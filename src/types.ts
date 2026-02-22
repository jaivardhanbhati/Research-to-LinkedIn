export interface ResearchResult {
  research: string;
  draft: string;
  searchSnippets?: string[];
}

export interface SavedPost {
  id: string;
  topic: string;
  research: string;
  content: string;
  createdAt: string;
}
