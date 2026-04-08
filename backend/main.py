from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import Response,StreamingResponse
import hashlib
import gzip
import os
import io
from datetime import datetime, timedelta
import sqlite3
from pydantic import BaseModel
import jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "hashive-dev-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
STORAGE_DIR = "storage"
DB_PATH = "hashive.db"

os.makedirs(STORAGE_DIR, exist_ok=True)

app = FastAPI(title="Hashive API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


# ---------- DB ----------

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            file_hash TEXT NOT NULL,
            original_size INTEGER NOT NULL,
            compressed_size INTEGER NOT NULL,
            is_duplicate INTEGER DEFAULT 0,
            duplicate_of TEXT,
            uploaded_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)
    conn.commit()
    conn.close()

init_db()


# ---------- Auth ----------

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    user = conn.execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()
    conn.close()
    if user is None:
        raise credentials_exception
    return dict(user)


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=204)

@app.get("/")
def root():
    return {"message": "API is running"}


@app.post("/auth/register", status_code=201)
def register(user: UserRegister):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    existing = conn.execute(
        "SELECT id FROM users WHERE username=? OR email=?",
        (user.username, user.email)
    ).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Username or email already exists")
    hashed = get_password_hash(user.password)
    conn.execute(
        "INSERT INTO users (username, email, hashed_password, created_at) VALUES (?,?,?,?)",
        (user.username, user.email, hashed, datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()
    return {"message": "User created successfully"}

@app.post("/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    user = conn.execute("SELECT * FROM users WHERE username=?", (form_data.username,)).fetchone()
    conn.close()
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    token = create_access_token({"sub": user["username"]})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/auth/me")
def me(current_user=Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "created_at": current_user["created_at"]
    }


# ---------- Files ----------

def compute_hash(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def compress_data(data: bytes) -> bytes:
    return gzip.compress(data)

@app.post("/files/upload")
async def upload_file(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    data = await file.read()
    original_size = len(data)
    file_hash = compute_hash(data)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    existing = conn.execute("SELECT * FROM files WHERE file_hash=? LIMIT 1", (file_hash,)).fetchone()
    is_duplicate = existing is not None
    duplicate_of = existing["filename"] if existing else None

    storage_path = os.path.join(STORAGE_DIR, f"{file_hash}.gz")
    if not os.path.exists(storage_path):
        compressed = compress_data(data)
        with open(storage_path, "wb") as f:
            f.write(compressed)
        compressed_size = len(compressed)
    else:
        compressed_size = os.path.getsize(storage_path)

    conn.execute(
        """INSERT INTO files (user_id, filename, original_filename, file_hash, original_size,
           compressed_size, is_duplicate, duplicate_of, uploaded_at)
           VALUES (?,?,?,?,?,?,?,?,?)""",
        (
            current_user["id"],
            f"{file_hash}_{file.filename}",
            file.filename,
            file_hash,
            original_size,
            compressed_size,
            1 if is_duplicate else 0,
            duplicate_of,
            datetime.utcnow().isoformat()
        )
    )
    conn.commit()
    conn.close()

    savings = original_size - compressed_size
    savings_pct = round((savings / original_size * 100) if original_size > 0 else 0, 2)

    return {
        "filename": file.filename,
        "file_hash": file_hash,
        "original_size": original_size,
        "compressed_size": compressed_size,
        "savings_bytes": savings,
        "savings_percent": savings_pct,
        "is_duplicate": is_duplicate,
        "duplicate_of": duplicate_of,
        "message": "Duplicate detected — pointer created, no new storage used." if is_duplicate else "File stored and compressed successfully."
    }

@app.get("/files")
def list_files(current_user=Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    files = conn.execute(
        "SELECT * FROM files WHERE user_id=? ORDER BY uploaded_at DESC",
        (current_user["id"],)
    ).fetchall()
    conn.close()
    return [dict(f) for f in files]


@app.get("/files/{file_id}/download")
def download_file(file_id: int, current_user=Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH); conn.row_factory = sqlite3.Row
    f = conn.execute("SELECT * FROM files WHERE id=? AND user_id=?", (file_id, current_user["id"])).fetchone()
    conn.close()
    if not f: raise HTTPException(status_code=404, detail="File not found")
    storage_path = os.path.join(STORAGE_DIR, f"{f['file_hash']}.gz")
    if not os.path.exists(storage_path): raise HTTPException(status_code=404, detail="Physical file not found")
    with open(storage_path, "rb") as gz: compressed = gz.read()
    decompressed = gzip.decompress(compressed)
    original_name = f["original_filename"]
    ext = original_name.rsplit(".", 1)[-1].lower() if "." in original_name else ""
    mime_map = {"pdf":"application/pdf","png":"image/png","jpg":"image/jpeg","jpeg":"image/jpeg",
        "txt":"text/plain","csv":"text/csv","json":"application/json","zip":"application/zip",
        "mp4":"video/mp4","docx":"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "xlsx":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "pptx":"application/vnd.openxmlformats-officedocument.presentationml.presentation"}
    return StreamingResponse(io.BytesIO(decompressed),
        media_type=mime_map.get(ext, "application/octet-stream"),
        headers={"Content-Disposition": f'attachment; filename="{original_name}"',
                 "Content-Length": str(len(decompressed))})


@app.delete("/files/{file_id}")
def delete_file(file_id: int, current_user=Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    f = conn.execute(
        "SELECT * FROM files WHERE id=? AND user_id=?",
        (file_id, current_user["id"])
    ).fetchone()
    if not f:
        conn.close()
        raise HTTPException(status_code=404, detail="File not found")
    others = conn.execute(
        "SELECT COUNT(*) as c FROM files WHERE file_hash=? AND id!=?",
        (f["file_hash"], file_id)
    ).fetchone()
    if others["c"] == 0:
        path = os.path.join(STORAGE_DIR, f"{f['file_hash']}.gz")
        if os.path.exists(path):
            os.remove(path)
    conn.execute("DELETE FROM files WHERE id=?", (file_id,))
    conn.commit()
    conn.close()
    return {"message": "File deleted"}

@app.get("/analytics")
def analytics(current_user=Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    files = conn.execute(
        "SELECT * FROM files WHERE user_id=?", (current_user["id"],)
    ).fetchall()
    conn.close()

    files = [dict(f) for f in files]
    total_files = len(files)
    duplicates = sum(1 for f in files if f["is_duplicate"])
    total_original = sum(f["original_size"] for f in files)
    total_compressed = sum(f["compressed_size"] for f in files)
    saved = total_original - total_compressed
    dedup_saved = sum(f["original_size"] for f in files if f["is_duplicate"])
    type_map = {}
    for f in files:
        ext = f["original_filename"].rsplit(".", 1)[-1].lower() if "." in f["original_filename"] else "other"
        if ext not in type_map: type_map[ext] = {"count": 0, "size": 0}
        type_map[ext]["count"] += 1
        type_map[ext]["size"] += f["original_size"]


    return {
        "total_files": total_files,
        "duplicate_files": duplicates,
        "unique_files": total_files - duplicates,
        "total_original_size": total_original,
        "total_compressed_size": total_compressed,
        "compression_savings_bytes": saved,
        "compression_savings_percent": round((saved / total_original * 100) if total_original > 0 else 0, 2),
        "deduplication_savings_bytes": dedup_saved,
        "total_savings_bytes": saved + dedup_saved,
        "total_savings_percent": round(((saved + dedup_saved) / total_original * 100) if total_original > 0 else 0, 2),
        "file_types": [{"type": k, "count": v["count"], "size": v["size"]} for k, v in type_map.items()]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

