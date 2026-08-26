# hwp-api (Java)

HWP / HWPX → markdown microservice for the ingestion pipeline. Self-hosted,
Java (Spring Boot) replacement for the Python `pyhwp` service — and for the
Upstage cloud API on the `.hwpx` path — using the Korean **hwplib** (`.hwp`)
and **hwpxlib** (`.hwpx`) libraries.

Same HTTP contract as the old Python service, so `lib/ingest/hwp.ts` and
`lib/ingest/hwpx.ts` call it unchanged.

## Endpoints

| Method | Path                        | Body (multipart) | Response                                  |
| ------ | --------------------------- | ---------------- | ----------------------------------------- |
| GET    | `/health`                   | —                | `{ "status": "healthy" }`                 |
| POST   | `/convert/hwp-to-markdown`  | `file` (.hwp)    | `{ success, filename, markdown, length }` |
| POST   | `/convert/hwpx-to-markdown` | `file` (.hwpx)   | `{ success, filename, markdown, length }` |

On failure: HTTP 500 with `{ "success": false, "error": "..." }`.

> The `markdown` field is currently extracted **text** (paragraphs + inline
> control/table text), matching what the pyhwp service returned. Richer
> table→pipe-table rendering can be added later by walking the hwplib/hwpxlib
> document model instead of using `TextExtractor`.

## Run

```bash
# Docker (used by docker-compose as the `hwp-api` service on :8000)
docker build -t hwp-api ./java-hwp
docker run --rm -p 8000:8000 hwp-api

# Local (needs JDK 17 + Maven)
mvn spring-boot:run

# Smoke test
curl -F "file=@sample.hwpx" http://localhost:8000/convert/hwpx-to-markdown
curl -F "file=@sample.hwp"  http://localhost:8000/convert/hwp-to-markdown
```

## Dependencies

- `kr.dogfoot:hwplib:1.1.9`
- `kr.dogfoot:hwpxlib:1.0.5`
- Spring Boot 3.3.5 (Java 17)
