# MarkItDown Converter API

Python FastAPI service that converts documents to Markdown using Microsoft's
[MarkItDown](https://github.com/microsoft/markitdown). It's a free, self-hosted
alternative to paid parsers like LlamaParse for non-HWP formats (PDF, DOCX,
PPTX, XLSX, HTML, images, CSV, JSON, and more).

HWP files stay on the sibling `python/` (pyhwp) service — MarkItDown does not
handle the HWP binary container.

## Image support (OCR)

Image files (`.png`/`.jpg`) return only EXIF metadata unless an LLM vision
client is configured. Set `OPENAI_API_KEY` (optionally `MARKITDOWN_LLM_MODEL`,
default `gpt-4o`) and the service transcribes/describes images into Markdown —
replacing LlamaParse's OCR. `GET /health` reports `image_llm: true` when active.

## Setup

### Build and Run with Docker

```bash
# Start only the MarkItDown API
docker-compose up markitdown-api --build
```

### Run Locally (without Docker)

```bash
cd python-markitdown
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

## API Endpoints

### Health Check
- **GET** `http://localhost:8001/health`
- Returns: `{"status": "healthy"}`

### Convert to Markdown
- **POST** `http://localhost:8001/convert/to-markdown`
- Content-Type: `multipart/form-data`
- Body: `file` (any MarkItDown-supported document)
- Returns: `{"success": true, "filename": "...", "markdown": "...", "length": 123}`

The converter is chosen from the file extension, so send the file with its
original name (e.g. `report.pdf`, `sheet.xlsx`).

## Example Usage

```bash
curl -X POST "http://localhost:8001/convert/to-markdown" \
  -F "file=@/path/to/document.pdf"
```

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`
