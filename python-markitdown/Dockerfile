FROM python:3.11-slim

WORKDIR /app

# MarkItDown's document backends are pure-Python wheels (pdfminer.six,
# python-docx, python-pptx, openpyxl), so no system libraries are required.

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
