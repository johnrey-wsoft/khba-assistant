# HWP Converter API

Python FastAPI service for converting HWP (Hangul Word Processor) files using pyhwp.

## Setup

### Build and Run with Docker

```bash
# Build and start all services (Next.js + HWP API)
docker-compose up --build

# Or start only the HWP API
docker-compose up hwp-api --build
```

### Run Locally (without Docker)

```bash
cd python
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## API Endpoints

### Health Check
- **GET** `http://localhost:8000/health`
- Returns: `{"status": "healthy"}`

### Convert HWP to Text
- **POST** `http://localhost:8000/convert/hwp-to-txt`
- Content-Type: `multipart/form-data`
- Body: `file` (HWP file)
- Returns: JSON with converted text

### Convert HWP to HTML
- **POST** `http://localhost:8000/convert/hwp-to-html`
- Content-Type: `multipart/form-data`
- Body: `file` (HWP file)
- Returns: JSON with converted HTML

## Example Usage

```bash
# Convert HWP to text
curl -X POST "http://localhost:8000/convert/hwp-to-txt" \
  -F "file=@/path/to/document.hwp"

# Convert HWP to HTML
curl -X POST "http://localhost:8000/convert/hwp-to-html" \
  -F "file=@/path/to/document.hwp"
```

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
