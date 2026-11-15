# Edge Function observability

All deployed Edge Functions use the shared wrapper in `supabase/functions/_shared/observability.ts`.

## Request correlation

Each request receives a server-generated UUID. The function returns it in the `x-request-id` response header and in JSON object responses as `request_id`. The CORS response exposes the header to browser clients. AI and vacancy-search errors also show this reference in the app. Include it when reporting a failed function request so an operator can locate the corresponding log record.

## Structured logs

The wrapper emits one JSON record for each completed request with these fields:

- `timestamp`: UTC ISO timestamp.
- `level`: `info` for completed requests and `error` for 5xx responses.
- `event`: `request.completed`, `request.failed`, or `request.unhandled_exception`.
- `function` and `request_id`: function name and the response correlation ID.
- `method`, `status_code`, and `duration_ms`: request outcome and latency.

Functions can add narrowly scoped event records for provider/database failures. Log only operational fields such as provider name, HTTP status, error code, and error class. Never log authorization headers, service keys, user IDs, email addresses, CV text, coach messages, interview answers, location queries, push endpoints, or full provider error bodies.

## Operator review

Use the Supabase Dashboard's Edge Function logs to filter by `request_id` or `function`. During rollout, review 5xx rates, latency, provider failures, and scheduler outcomes. This repository emits correlated logs but does not configure an external APM service, alert thresholds, an on-call rotation, or a log-retention policy. Select and configure those operational controls for the hosted project before public launch.
