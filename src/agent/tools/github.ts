// src/agent/tools/github.ts
import { registerAuthTool } from './tool-registry';
import { getValidToken } from '@/lib/get-valid-token';
import type { AgentTool } from './types';

const GITHUB_API = 'https://api.github.com';

function githubHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'OpenSlides',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

// --- List user's repos ---
const githubListRepos: AgentTool = {
  name: 'github_list_repos',
  description:
    "List the user's GitHub repositories. Use when the user says 'show my repos', 'list my GitHub projects', or wants to pick a repo to pull content from.",
  providerTag: 'github',
  input_schema: {
    type: 'object',
    properties: {
      sort: {
        type: 'string',
        description: 'Sort by: updated, created, pushed, full_name. Default: updated',
      },
      per_page: {
        type: 'number',
        description: 'Number of repos to return (max 30). Default: 10',
      },
    },
  },
  async execute(input, _signal, context) {
    if (!context?.userId) return { error: 'NOT_CONNECTED', code: 'NOT_CONNECTED' };
    const token = await getValidToken(context.userId, 'github');
    if (!token) return { error: 'NOT_CONNECTED', code: 'NOT_CONNECTED' };

    const { sort = 'updated', per_page = 10 } = input as { sort?: string; per_page?: number };
    const params = new URLSearchParams({
      sort,
      per_page: String(Math.min(per_page, 30)),
      direction: 'desc',
    });

    const res = await fetch(`${GITHUB_API}/user/repos?${params}`, {
      headers: githubHeaders(token),
    });
    if (!res.ok) return { error: `GitHub API error: ${res.status}` };

    const repos = (await res.json()) as Array<{
      full_name: string;
      description: string | null;
      language: string | null;
      stargazers_count: number;
      updated_at: string;
      html_url: string;
      private: boolean;
    }>;

    return {
      repos: repos.map((r) => ({
        name: r.full_name,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        updatedAt: r.updated_at,
        url: r.html_url,
        private: r.private,
      })),
    };
  },
};

// --- Read a file from a repo ---
const githubReadFile: AgentTool = {
  name: 'github_read_file',
  description:
    "Read a file from a GitHub repository. Use when the user wants to pull code, README, or any file content from a repo into their presentation.",
  providerTag: 'github',
  input_schema: {
    type: 'object',
    properties: {
      repo: { type: 'string', description: 'Repository in owner/repo format (e.g., "vercel/next.js")' },
      path: { type: 'string', description: 'File path in the repo (e.g., "README.md", "src/index.ts")' },
      ref: { type: 'string', description: 'Branch or commit SHA. Default: default branch' },
    },
    required: ['repo', 'path'],
  },
  async execute(input, _signal, context) {
    if (!context?.userId) return { error: 'NOT_CONNECTED', code: 'NOT_CONNECTED' };
    const token = await getValidToken(context.userId, 'github');
    if (!token) return { error: 'NOT_CONNECTED', code: 'NOT_CONNECTED' };

    const { repo, path, ref } = input as { repo: string; path: string; ref?: string };
    const params = ref ? `?ref=${encodeURIComponent(ref)}` : '';

    const res = await fetch(
      `${GITHUB_API}/repos/${repo}/contents/${encodeURIComponent(path)}${params}`,
      { headers: githubHeaders(token) }
    );
    if (!res.ok) return { error: `GitHub API error: ${res.status}` };

    const data = (await res.json()) as {
      name: string;
      path: string;
      content?: string;
      encoding?: string;
      size: number;
      type: string;
      html_url: string;
    };

    // Directory listing
    if (Array.isArray(data)) {
      return {
        type: 'directory',
        entries: (data as Array<{ name: string; path: string; type: string; size: number }>).map((e) => ({
          name: e.name,
          path: e.path,
          type: e.type,
          size: e.size,
        })),
      };
    }

    // File content (base64 decoded)
    if (data.content && data.encoding === 'base64') {
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return {
        name: data.name,
        path: data.path,
        content: content.slice(0, 15000), // cap for context
        size: data.size,
        url: data.html_url,
      };
    }

    return { name: data.name, path: data.path, size: data.size, url: data.html_url };
  },
};

// --- Search repos or code ---
const githubSearch: AgentTool = {
  name: 'github_search',
  description:
    "Search GitHub for repositories or code. Use when the user says 'find a repo about X', 'search GitHub for Y', or wants to discover projects.",
  providerTag: 'github',
  input_schema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      type: {
        type: 'string',
        description: '"repositories" or "code". Default: repositories',
      },
      per_page: { type: 'number', description: 'Number of results (max 10). Default: 5' },
    },
    required: ['query'],
  },
  async execute(input, _signal, context) {
    if (!context?.userId) return { error: 'NOT_CONNECTED', code: 'NOT_CONNECTED' };
    const token = await getValidToken(context.userId, 'github');
    if (!token) return { error: 'NOT_CONNECTED', code: 'NOT_CONNECTED' };

    const { query, type = 'repositories', per_page = 5 } = input as {
      query: string;
      type?: string;
      per_page?: number;
    };

    const params = new URLSearchParams({
      q: query,
      per_page: String(Math.min(per_page, 10)),
    });

    const res = await fetch(`${GITHUB_API}/search/${type}?${params}`, {
      headers: githubHeaders(token),
    });
    if (!res.ok) return { error: `GitHub API error: ${res.status}` };

    const data = (await res.json()) as { total_count: number; items: unknown[] };

    if (type === 'code') {
      const items = data.items as Array<{
        name: string;
        path: string;
        repository: { full_name: string };
        html_url: string;
      }>;
      return {
        totalCount: data.total_count,
        results: items.map((i) => ({
          file: i.name,
          path: i.path,
          repo: i.repository.full_name,
          url: i.html_url,
        })),
      };
    }

    const items = data.items as Array<{
      full_name: string;
      description: string | null;
      language: string | null;
      stargazers_count: number;
      html_url: string;
    }>;
    return {
      totalCount: data.total_count,
      results: items.map((r) => ({
        name: r.full_name,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        url: r.html_url,
      })),
    };
  },
};

registerAuthTool(githubListRepos);
registerAuthTool(githubReadFile);
registerAuthTool(githubSearch);

export { githubListRepos, githubReadFile, githubSearch };
