import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from markitdown import MarkItDown

app = FastAPI(title="MarkItDown Converter API", version="1.0.0")


def _build_converter() -> MarkItDown:
    """
    A single reusable converter. MarkItDown picks the right backend from the
    file extension (PDF, DOCX, PPTX, XLSX, HTML, images, CSV, JSON, ...), so one
    generic endpoint covers every format LlamaParse used to handle.

    When OPENAI_API_KEY is set, an OpenAI vision client is wired in so image
    files (.png/.jpg) are transcribed/described (MarkItDown returns only EXIF
    metadata for images without an LLM client). This replaces LlamaParse's OCR.
    """
    kwargs = {"enable_plugins": False}

    api_key = os.environ.get("OPENAI_API_KEY")
    if api_key:
        from openai import OpenAI

        kwargs["llm_client"] = OpenAI(api_key=api_key)
        kwargs["llm_model"] = os.environ.get("MARKITDOWN_LLM_MODEL", "gpt-4o")
        kwargs["llm_prompt"] = (
            "Transcribe all text in this image into Markdown. Preserve tables, "
            "headings and layout. If there is no text, briefly describe the image."
        )

    return MarkItDown(**kwargs)


_md = _build_converter()
_llm_enabled = bool(os.environ.get("OPENAI_API_KEY"))


@app.get("/")
async def root():
    return {"message": "MarkItDown Converter API is running", "version": "1.0.0"}


@app.get("/health")
async def health():
    # image_llm reflects whether image transcription/description is enabled.
    return {"status": "healthy", "image_llm": _llm_enabled}


@app.post("/convert/to-markdown")
async def convert_to_markdown(file: UploadFile = File(...)):
    """
    Convert any MarkItDown-supported document to markdown.

    Mirrors the pyhwp service response shape ({success, filename, markdown,
    length}) so the ingestion pipeline can swap parsers without changes.
    """
    # Preserve the original suffix — MarkItDown selects its converter from the
    # file extension, so a temp file without one would fail to route.
    suffix = Path(file.filename or "").suffix

    temp_file_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            contents = await file.read()
            temp_file.write(contents)
            temp_file_path = temp_file.name

        result = _md.convert(temp_file_path)
        markdown = result.text_content or ""

        return JSONResponse(
            {
                "success": True,
                "filename": file.filename,
                "markdown": markdown,
                "length": len(markdown),
            }
        )
    except Exception as e:
        return JSONResponse(
            {"success": False, "error": str(e)},
            status_code=500,
        )
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
