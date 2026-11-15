# AI usage limits and operations

Career Pilot applies both a per-account request quota and a global daily token budget before it calls the model provider. The daily budget is enforced by a database reservation function, so simultaneous requests share one allowance. This document describes the current defaults and the operator controls for a deployed project.

## Limits and accounting

- Per-account quotas are counted over a rolling seven-day window. The free access tier allows 15 coach, 5 resume, 5 interview-feedback, and 1 custom-role request. The Pro access tier allows 100, 40, 40, and 5 respectively.
- The global budget defaults to 200,000 tokens per UTC day. Change this based on the provider, model, and launch traffic before enabling AI for real users.
- Before a request starts, the gateway reserves a conservative allowance based on twice the input and instruction character count, plus the maximum output tokens for that feature. The reservation prevents concurrent requests from spending the same remaining allowance. On success, provider-reported token usage replaces the estimate. Provider failures release the reservation.
- A request is rejected with HTTP 429 when either its feature quota or the global daily budget is exhausted. The global allowance resets at 00:00 UTC.
- Pending reservations older than five minutes are cleared by the next reservation. The provider request timeout is 25 seconds.
- Validated generic custom-role plans are cached for up to 90 days using a SHA-256 key over normalized role, category, experience, and baseline-skill inputs. Cache entries store only validated milestones and effort, never the original role title or request. Cache hits count toward the role request quota but consume zero provider tokens and remain available when the daily token budget is exhausted.

The budget is a token-volume cap, not a currency cap. Provider pricing and tokenization vary by model. Configure a separate hard spend limit or alert in the model provider's account.

## Configure the daily budget

Use the Supabase SQL editor as a project administrator. The value must be a JSON number from 1 through 1,000,000,000.

```sql
update public.app_settings
set value = '200000'::jsonb,
    updated_at = now()
where key = 'ai_daily_token_budget_tokens';
```

Keep the existing `ai_enabled` kill switch available to operators:

```sql
update public.app_settings
set value = 'false'::jsonb,
    updated_at = now()
where key = 'ai_enabled';
```

Set the value back to JSON `true` to restore AI requests after investigating the incident. These settings are not writable through the browser Data API.

## Review daily usage

The migration adds `public.ai_usage_daily_summary`, a UTC-day and feature-level summary of completed calls and pending token reservations. Query it from the Supabase SQL editor or another trusted operator context:

```sql
select
  usage_day,
  feature,
  completed_requests,
  pending_requests,
  tokens_in,
  tokens_out,
  reserved_tokens,
  cached_requests
from public.ai_usage_daily_summary
order by usage_day desc, feature;
```

The view is granted only to `service_role` and database administrators. Do not grant it to `anon` or `authenticated`, expose it through a client API, or put the service-role key in the frontend.

## Deployment checklist

1. Apply the migrations that add the global reservation, summary view, and service-role-only generic role-template cache.
2. Set a daily token limit appropriate for the expected traffic and selected model.
3. Configure provider-side currency limits and alerts; token caps alone do not guarantee a fixed dollar spend.
4. Deploy `ai-gateway` with the provider key and model name in Edge Function secrets.
5. Confirm the `ai_enabled` switch is `true` only after the provider, limits, and monitoring are ready.
6. Review the daily summary during rollout and lower or raise the budget based on actual token usage and provider invoices.
