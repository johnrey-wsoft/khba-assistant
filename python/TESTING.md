# Testing Guide: HWP Parser Integration

This guide covers testing the HWP parsing functionality and the complete ingest pipeline.

## Prerequisites

1. **Start the FastAPI service:**

   ```bash
   cd python
   .\venv\Scripts\activate
   uvicorn main:app --reload --port 8000
   ```

2. **Ensure environment variables are set:**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   DATABASE_URL=your_database_url
   LLAMA_CLOUD_API_KEY=your_llama_cloud_key
   ```

## Testing the FastAPI Service

### 1. Health Check

Test that the FastAPI service is running:

```bash
curl http://127.0.0.1:8000/health
```

Expected response:

```json
{ "status": "healthy" }
```

### 2. Test HWP to Markdown Conversion

Upload an HWP file for conversion:

```bash
curl -X POST "http://127.0.0.1:8000/convert/hwp-to-markdown" \
  -F "file=@path/to/your/file.hwp"
```

Expected response:

```json
{
  "success": true,
  "filename": "your-file.hwp",
  "markdown": "...extracted text content...",
  "length": 123456
}
```

### 3. Interactive API Documentation

Visit the Swagger UI for interactive testing:

- URL: `http://127.0.0.1:8000/docs`
- Provides a web interface to test all endpoints
- Upload files directly through the browser

## Testing the Ingest Pipeline

### 1. Test Single Document

Ingest a specific HWP document:

```bash
pnpm ingest --codes LAW-2026-000501
```

Expected output:

```
[ingest:cli] run start docs=1 codes=LAW-2026-000501
[ingest:cli] parse start 1/1 doc=LAW-2026-000501 file=documents/your-file.hwp
[ingest:cli] parsed 1/1 doc=LAW-2026-000501 chars=123456 took=X.Xs
[ingest:cli] chunked 1/1 doc=LAW-2026-000501 chunks=X took=X.Xs
[ingest:cli] embedded 1/1 doc=LAW-2026-000501 vectors=X took=X.Xs
[ingest:cli] done 1/1 doc=LAW-2026-000501 evidence=X took=X.Xs
[ingest:cli] summary ok=1 failed=0 evidence=X took=X.Xs
```

### 2. Test Multiple Documents

Ingest multiple specific documents:

```bash
pnpm ingest --codes LAW-2026-000501,LAW-2026-000502,LAW-2026-000503
```

### 3. Test All Documents

Ingest all documents in the manifest:

```bash
pnpm ingest
```

## Verification Steps

### 1. Check Database Records

Verify that documents were stored in the database:

```sql
SELECT * FROM documents WHERE document_code = 'LAW-2026-000501';
```

### 2. Check Text Extraction Quality

Review the extracted text to ensure:

- Text is readable and properly formatted
- No table markers (`<표>`) in the content
- Character count is reasonable (should be thousands, not hundreds)

### 3. Check Chunking

Verify that the document was properly chunked:

- Chunks should be meaningful segments
- Not too short (single words) or too long (entire document)

### 4. Check Embeddings

Verify that embeddings were generated:

- Vector count should match chunk count
- No embedding generation errors

## Troubleshooting

### FastAPI Service Issues

**Service not responding:**

```bash
# Check if the service is running
curl http://127.0.0.1:8000/health

# Restart the service if needed
# Stop: Ctrl+C in the terminal
# Start: uvicorn main:app --reload --port 8000
```

**Import errors:**

```bash
# Ensure virtual environment is activated
cd python
.\venv\Scripts\activate

# Reinstall dependencies if needed
pip install -r requirements.txt
```

### Ingest Pipeline Issues

**Database connection errors:**

- Verify `DATABASE_URL` is set correctly
- Ensure database is accessible

**API connection errors:**

- Verify `NEXT_PUBLIC_API_URL` is set to `http://localhost:8000`
- Ensure FastAPI service is running

**Text extraction issues:**

- Check that HWP file is not corrupted
- Verify pyhwp is installed correctly
- Test with a simple HWP file first

## Performance Benchmarks

Based on testing with the income tax form:

- **Parse time:** ~30 seconds
- **Chunk time:** ~2 seconds
- **Embed time:** ~2 seconds
- **Total per document:** ~35 seconds

Expected character extraction: 100,000+ characters for complex forms.

## Test Files

Use the provided test HWP files in `data/documents/`:

- `income-tax-return-form-40-1.hwp` - Complex tax form (122,992 chars)
- `income-tax-return-form-40-4.hwp` - Additional tax form
- `income-tax-return-form-40-5.hwp` - Additional tax form

## Integration Testing

Test the complete flow:

1. **Start FastAPI service** (port 8000)
2. **Run ingest** for a single HWP file
3. **Verify database** has the document and chunks
4. **Test search/query** functionality using the ingested data
5. **Check logs** for any errors or warnings

## Continuous Testing

For development, run the ingest pipeline with specific document codes to avoid re-processing all documents:

```bash
pnpm ingest --codes YOUR_DOCUMENT_CODE
```

This allows for quick iteration and testing of changes to the parsing logic.
