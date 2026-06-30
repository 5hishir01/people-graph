# People Graph

Obsidian-style knowledge graph for your personal network. Nodes = people, hover = social card.

## Stack
- Vite + React + TypeScript
- Tailwind CSS v3
- Zustand (state + localStorage persistence)
- Supabase (optional — for Phase 2 sync + auth)

## Setup

```bash
npm install
cp .env.example .env.local   # optional — app works without Supabase in local mode
npm run dev
```

## Phase roadmap

| Phase | Status | What it does |
|-------|--------|--------------|
| 1 | ✅ This build | Graph canvas, hover cards, add/edit/delete, localStorage |
| 2 | Next | Supabase sync, auth, MCP server for live enrichment |
| 3 | Later | Globe map view (geo regions for groups), AR glasses integration (Meta / Snap SDK) |

## Supabase schema (Phase 2)

```sql
create table people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  role text,
  category text,
  linkedin text,
  twitter text,
  github text,
  email text,
  website text,
  x float8 default 300,
  y float8 default 200,
  r float8 default 14,
  tags text[] default '{}',
  notes text,
  created_at timestamptz default now()
);

create table edges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  source uuid references people(id) on delete cascade,
  target uuid references people(id) on delete cascade
);

alter table people enable row level security;
alter table edges  enable row level security;

create policy "users own their people" on people for all using (auth.uid() = user_id);
create policy "users own their edges"  on edges  for all using (auth.uid() = user_id);
```

## MCP server (Phase 2 — `src/mcp/server.py`)

Each MCP tool enriches a person node on demand:
- `linkedin_lookup` → Proxycurl API
- `github_lookup`   → GitHub REST API
- `news_lookup`     → Serper / Tavily
- `crunchbase_lookup` → Crunchbase API

## Color legend

| Color  | Category   |
|--------|------------|
| Teal   | Mentor     |
| Blue   | Teammate   |
| Amber  | Employer / H1B |
| Purple | Hackathon  |
| Gray   | Default    |
