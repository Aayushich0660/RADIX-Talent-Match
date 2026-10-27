"""Standalone Role 2 parser API, served separately from the Role 3 backend."""

import io
import os
import tempfile
import zipfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from starlette.concurrency import run_in_threadpool

from extractor import parse_resume

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
USE_LLM = os.getenv("RESUME_PARSER_USE_LLM", "").strip().lower() == "true"

app = FastAPI(title="RADIX Talent Match - Resume Parsing")


@app.get("/health")
def health():
    return {
        "ok": True,
        "mode": "llm_opt_in" if USE_LLM else "offline_heuristic",
    }


def _validate_document(contents: bytes, extension: str) -> None:
    if not contents:
        raise HTTPException(status_code=422, detail="The selected file is empty.")

    if extension == ".pdf":
        if not contents.startswith(b"%PDF-"):
            raise HTTPException(status_code=422, detail="The file does not contain a valid PDF signature.")
        return

    if not contents.startswith(b"PK"):
        raise HTTPException(status_code=422, detail="The file does not contain a valid DOCX signature.")

    try:
        with zipfile.ZipFile(io.BytesIO(contents)) as document:
            names = set(document.namelist())
            if "[Content_Types].xml" not in names or "word/document.xml" not in names:
                raise HTTPException(status_code=422, detail="The DOCX file is missing required document content.")
            if document.testzip() is not None:
                raise HTTPException(status_code=422, detail="The DOCX file is damaged and cannot be read.")
    except zipfile.BadZipFile as error:
        raise HTTPException(status_code=422, detail="The DOCX file is malformed and cannot be read.") from error


@app.post("/parse-resume")
async def parse(file: UploadFile = File(...)):
    filename = Path(file.filename or "").name
    extension = Path(filename).suffix.lower()
    temp_path = None
    contents = b""
    try:
        if extension not in {".pdf", ".docx"}:
            raise HTTPException(status_code=400, detail="Choose a PDF (.pdf) or Word document (.docx).")

        contents = await file.read(MAX_FILE_SIZE_BYTES + 1)
        if len(contents) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(status_code=413, detail="The file exceeds the 10 MB maximum size limit.")
        _validate_document(contents, extension)

        with tempfile.NamedTemporaryFile(suffix=extension, delete=False) as temp_file:
            temp_file.write(contents)
            temp_path = temp_file.name
        result = await run_in_threadpool(parse_resume, temp_path, USE_LLM)
        result.source_file = filename
        return result.model_dump()
    except ValueError as error:
        raise HTTPException(
            status_code=422,
            detail="The document is malformed or has no readable text. Check that it is a valid PDF/DOCX with selectable text.",
        ) from error
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail="Resume parsing failed. Please try a different PDF or DOCX, or continue with manual entry.",
        ) from error
    finally:
        contents = b""
        if temp_path is not None:
            try:
                os.unlink(temp_path)
            except FileNotFoundError:
                pass
        await file.close()
