from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import hwp5

app = FastAPI(title="HWP Converter API", version="1.0.0")


@app.get("/")
async def root():
    return {"message": "HWP Converter API is running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/convert/hwp-to-txt")
async def convert_hwp_to_txt(file: UploadFile = File(...)):
    """
    Convert HWP file to text format
    """
    try:
        # Save uploaded file temporarily
        import tempfile
        import os
        import subprocess
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".hwp") as temp_file:
            contents = await file.read()
            temp_file.write(contents)
            temp_file_path = temp_file.name
        
        try:
            # Use hwp5txt command line tool
            result = subprocess.run(
                ["hwp5txt", temp_file_path],
                capture_output=True,
                text=True,
                check=True
            )
            text = result.stdout
            
            return JSONResponse({
                "success": True,
                "filename": file.filename,
                "text": text,
                "length": len(text)
            })
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    except Exception as e:
        return JSONResponse(
            {"success": False, "error": str(e)},
            status_code=500
        )


@app.post("/convert/hwp-to-html")
async def convert_hwp_to_html(file: UploadFile = File(...)):
    """
    Convert HWP file to HTML format
    """
    try:
        # Save uploaded file temporarily
        import tempfile
        import os
        import subprocess
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".hwp") as temp_file:
            contents = await file.read()
            temp_file.write(contents)
            temp_file_path = temp_file.name
        
        try:
            # Use hwp5html command line tool
            result = subprocess.run(
                ["hwp5html", temp_file_path],
                capture_output=True,
                text=True,
                check=True
            )
            html = result.stdout
            
            return JSONResponse({
                "success": True,
                "filename": file.filename,
                "html": html,
                "length": len(html)
            })
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    except Exception as e:
        return JSONResponse(
            {"success": False, "error": str(e)},
            status_code=500
        )


@app.post("/convert/hwp-to-markdown")
async def convert_hwp_to_markdown(file: UploadFile = File(...)):
    """
    Convert HWP file to markdown format (for document ingestion pipeline)
    """
    try:
        # Save uploaded file temporarily
        import tempfile
        import os
        import subprocess
        import shutil
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".hwp") as temp_file:
            contents = await file.read()
            temp_file.write(contents)
            temp_file_path = temp_file.name
        
        temp_dir = tempfile.mkdtemp()
        
        try:
            # Use hwp5proc to extract virtual streams
            result = subprocess.run(
                ["hwp5proc", "unpack", "--vstreams", temp_file_path, temp_dir],
                capture_output=True,
                text=True,
                check=True
            )
            
            # Try to read from BodyText.xml and extract text content using lxml
            bodytext_xml = os.path.join(temp_dir, "BodyText.xml")
            text = ""
            
            if os.path.exists(bodytext_xml):
                try:
                    from lxml import etree
                    tree = etree.parse(bodytext_xml)
                    # Use lxml's itertext() method to extract all text
                    text = ' '.join(tree.itertext())
                except:
                    text = ""
            
            # If BodyText.xml doesn't work, fallback to PrvText.utf8
            if not text or len(text) < 100:
                prvtext_path = os.path.join(temp_dir, "PrvText.utf8")
                if os.path.exists(prvtext_path):
                    with open(prvtext_path, 'r', encoding='utf-8') as f:
                        text = f.read()
            
            return JSONResponse({
                "success": True,
                "filename": file.filename,
                "markdown": text,
                "length": len(text)
            })
        finally:
            # Clean up temporary files and directory
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
    except Exception as e:
        return JSONResponse(
            {"success": False, "error": str(e)},
            status_code=500
        )
