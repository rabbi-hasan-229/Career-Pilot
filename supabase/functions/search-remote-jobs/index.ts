// Authenticated, read-only search proxy for Remote OK's public remote-job feed.
// Results are returned transiently; they are not copied into Career Pilot tables.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { serveObservedEdgeFunction, type EdgeRequestContext } from '../_shared/observability.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const categoryTags: Record<string, string> = {
  'Software & Web': 'dev',
  'AI & Data Science': 'python',
  'Cloud & DevOps': 'devops',
  Cybersecurity: 'infosec',
  'Mobile & Multiplatform': 'mobile',
  'Game Dev & 3D': 'game',
  'UI/UX & Product Design': 'design',
  'Product & Agile Leadership': 'product',
  'QA & Reliability': 'testing',
  'FinTech & Web3': 'finance',
  'Hardware & Robotics': 'hardware',
  'Enterprise & Applied Tech': 'sales',
};

interface RemoteOkJob {
  id?: string | number;
  position?: string;
  company?: string;
  location?: string;
  tags?: unknown;
  description?: string;
  url?: string;
  date?: string;
  salary_min?: number;
  salary_max?: number;
}

interface JoobleJob {
  id?: string | number;
  title?: string;
  company?: string;
  location?: string;
  salary?: string;
  snippet?: string;
  link?: string;
  updated?: string;
  type?: string;
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function containsPhrase(searchable: string, phrase: string): boolean {
  const paddedText = ` ${searchable} `;
  const normalizedPhrase = normalize(phrase);
  if (!normalizedPhrase) return false;
  if (paddedText.includes(` ${normalizedPhrase} `)) return true;
  const withoutVersion = normalize(phrase.replace(/\b\d+(?:\.\d+)*\b/g, ' '));
  return withoutVersion.length >= 3 && paddedText.includes(` ${withoutVersion} `);
}

function tokens(value: string): string[] {
  const ignored = new Set(['and', 'for', 'the', 'with', 'from', 'senior', 'junior', 'staff', 'lead', 'principal', 'remote']);
  return [...new Set(normalize(value).split(' ').filter((token) => token.length > 2 && !ignored.has(token)))].slice(0, 12);
}

function allowedListingUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || (host !== 'remoteok.com' && host !== 'www.remoteok.com')) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function salaryRange(job: RemoteOkJob): string {
  const minimum = Number(job.salary_min);
  const maximum = Number(job.salary_max);
  if (Number.isFinite(minimum) && Number.isFinite(maximum) && (minimum > 0 || maximum > 0)) {
    return `Source range ${minimum.toLocaleString()}–${maximum.toLocaleString()}`;
  }
  return 'Salary not provided';
}

function joobleListingUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !/(^|\.)jooble\.org$/i.test(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function validJoobleHost(value: string): boolean {
  return value === 'jooble.org' || /^[a-z]{2}\.jooble\.org$/i.test(value);
}

async function searchJooble(query: string, location: string, hybridOnly: boolean, skillNames: string[], observability: Pick<EdgeRequestContext, 'log'>) {
  const apiKey = Deno.env.get('JOOBLE_API_KEY');
  const host = (Deno.env.get('JOOBLE_API_HOST') || 'jooble.org').toLowerCase();
  if (!apiKey || !validJoobleHost(host)) {
    return json({ error: 'Regional job search is not configured for this market yet.' }, 503);
  }

  const keywords = hybridOnly ? `${query} hybrid` : query;
  const providerResponse = await fetch(`https://${host}/api/${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ keywords, location, page: '1', ResultOnPage: '25', companysearch: false }),
    signal: AbortSignal.timeout(12000),
  });
  if (!providerResponse.ok) {
    observability.log('error', 'job_provider.request_failed', { provider: 'jooble', status_code: providerResponse.status });
    return json({ error: providerResponse.status === 429 ? 'Regional job search has reached its provider limit. Try again later.' : 'Regional listings are temporarily unavailable. Try again later.' }, providerResponse.status === 429 ? 429 : 502);
  }

  const providerText = await providerResponse.text();
  if (providerText.length > 2_000_000) return json({ error: 'Regional listing response was too large.' }, 502);
  const providerBody = JSON.parse(providerText) as { jobs?: unknown };
  if (!Array.isArray(providerBody.jobs)) return json({ error: 'Regional listing source returned an invalid response.' }, 502);

  const roleTokens = tokens(query);
  const normalizedSkills = skillNames.map(normalize).filter(Boolean);
  const jobs = providerBody.jobs
    .filter((item): item is JoobleJob => Boolean(item) && typeof item === 'object')
    .map((job) => {
      const title = cleanText(job.title, 160);
      const company = cleanText(job.company, 120) || 'Company not provided';
      const description = cleanText(job.snippet, 1800);
      const sourceUrl = joobleListingUrl(job.link);
      const id = String(job.id || '');
      if (!id || id.length > 80 || !title || !sourceUrl) return null;
      const workText = normalize(`${title} ${description}`);
      if (hybridOnly && !/(^|\s)hybrid(\s|$)/.test(workText)) return null;

      const searchable = normalize(`${title} ${company} ${description}`);
      const searchableTokens = new Set(searchable.split(' '));
      const roleHits = roleTokens.filter((token) => searchableTokens.has(token)).length;
      const skillHits = normalizedSkills.filter((skill) => containsPhrase(searchable, skill)).length;
      const relevance = roleHits * 3 + skillHits;
      return {
        id,
        title,
        company,
        location: cleanText(job.location, 140) || location,
        salary_range: cleanText(job.salary, 120) || 'Salary not provided',
        source_url: sourceUrl,
        published_at: typeof job.updated === 'string' && Number.isFinite(Date.parse(job.updated)) ? new Date(job.updated).toISOString() : null,
        tags: typeof job.type === 'string' ? [cleanText(job.type, 48)].filter(Boolean) : [],
        description,
        relevance,
      };
    })
    .filter((job): job is NonNullable<typeof job> => job !== null && job.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance || Date.parse(b.published_at || '') - Date.parse(a.published_at || ''))
    .slice(0, 24)
    .map(({ relevance: _relevance, ...job }) => job);

  return json({ source: 'Jooble', fetched_at: new Date().toISOString(), jobs });
}

serveObservedEdgeFunction('search-remote-jobs', async (req: Request, observability) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  try {
    const authorization = req.headers.get('Authorization') || '';
    const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!accessToken) return json({ error: 'Authentication required.' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Remote job search is not configured.' }, 503);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error: authError } = await admin.auth.getUser(accessToken);
    if (authError || !user) return json({ error: 'Invalid or expired session.' }, 401);

    const contentLength = Number(req.headers.get('Content-Length') || 0);
    if (contentLength > 6000) return json({ error: 'Request is too large.' }, 413);
    const rawBody = await req.text();
    if (rawBody.length > 6000) return json({ error: 'Request is too large.' }, 413);
    let body: Record<string, unknown>;
    try {
      const parsed = JSON.parse(rawBody) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return json({ error: 'Invalid request.' }, 400);
      body = parsed as Record<string, unknown>;
    } catch {
      return json({ error: 'Request must be valid JSON.' }, 400);
    }

    const query = typeof body.query === 'string' ? body.query.trim().replace(/\s+/g, ' ') : '';
    const category = typeof body.category === 'string' ? body.category : '';
    const modeInput = body.mode;
    if (modeInput !== undefined && modeInput !== 'remote' && modeInput !== 'regional' && modeInput !== 'hybrid') {
      return json({ error: 'Choose remote, regional, or hybrid search.' }, 400);
    }
    const mode = modeInput ?? 'remote';
    const location = typeof body.location === 'string' ? body.location.trim().replace(/\s+/g, ' ') : '';
    const skillInput = Array.isArray(body.skills) ? body.skills : [];
    if (query.length < 2 || query.length > 120 || !Object.prototype.hasOwnProperty.call(categoryTags, category)
      || (mode !== 'remote' && (location.length < 2 || location.length > 100))
      || skillInput.length > 20 || skillInput.some((skill) => typeof skill !== 'string' || skill.length > 80)) {
      return json({ error: 'Provide a role, supported career category, and no more than 20 skill names.' }, 400);
    }
    const skillNames = [...new Set((skillInput as string[]).map((skill) => skill.trim()).filter(Boolean))];

    if (mode !== 'remote') return await searchJooble(query, location, mode === 'hybrid', skillNames, observability);

    const tag = categoryTags[category];
    const providerUrl = new URL(`https://remoteok.com/api?tag=${encodeURIComponent(tag)}`);
    const providerResponse = await fetch(providerUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'CareerPilot/1.0 (authenticated remote job search)',
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!providerResponse.ok) {
      observability.log('error', 'job_provider.request_failed', { provider: 'remoteok', status_code: providerResponse.status });
      return json({ error: 'Remote listings are temporarily unavailable. Try again later.' }, providerResponse.status === 429 ? 429 : 502);
    }

    const providerText = await providerResponse.text();
    if (providerText.length > 5_000_000) return json({ error: 'Remote listing response was too large.' }, 502);
    const providerBody = JSON.parse(providerText) as unknown;
    if (!Array.isArray(providerBody)) return json({ error: 'Remote listing source returned an invalid response.' }, 502);

    const roleTokens = tokens(query);
    const normalizedSkills = skillNames.map(normalize).filter(Boolean);
    const jobs = providerBody
      .filter((item): item is RemoteOkJob => Boolean(item) && typeof item === 'object')
      .map((job) => {
        const title = cleanText(job.position, 160);
        const company = cleanText(job.company, 120);
        const description = cleanText(job.description, 1800);
        const tags = Array.isArray(job.tags)
          ? job.tags.filter((value): value is string => typeof value === 'string').map((value) => cleanText(value, 48)).filter(Boolean).slice(0, 16)
          : [];
        const sourceUrl = allowedListingUrl(job.url);
        const id = String(job.id || '');
        if (!id || id.length > 60 || !title || !company || !sourceUrl) return null;

        const searchable = normalize(`${title} ${company} ${tags.join(' ')} ${description}`);
        const searchableTokens = new Set(searchable.split(' '));
        const roleHits = roleTokens.filter((token) => searchableTokens.has(token)).length;
        const skillHits = normalizedSkills.filter((skill) => containsPhrase(searchable, skill)).length;
        const relevance = roleHits * 3 + skillHits;

        return {
          id,
          title,
          company,
          location: cleanText(job.location, 140) || 'Remote',
          salary_range: salaryRange(job),
          source_url: sourceUrl,
          published_at: typeof job.date === 'string' && Number.isFinite(Date.parse(job.date)) ? new Date(job.date).toISOString() : null,
          tags,
          description,
          relevance,
        };
      })
      .filter((job): job is NonNullable<typeof job> => job !== null && job.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance || Date.parse(b.published_at || '') - Date.parse(a.published_at || ''))
      .slice(0, 24)
      .map(({ relevance: _relevance, ...job }) => job);

    return json({ source: 'Remote OK', fetched_at: new Date().toISOString(), jobs });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    observability.log('error', 'job_search.request_failed', { error_name: error instanceof Error ? error.name : 'UnknownError' });
    return json({ error: message.includes('timeout') ? 'Remote job search timed out. Try again.' : 'Remote listings are temporarily unavailable. Try again later.' }, 502);
  }
});
