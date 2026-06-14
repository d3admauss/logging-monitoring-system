import sqlite3
import datetime
import random
import psutil
import os
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="Logging & Monitoring System")

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Initialize SQLite Database
def init_db():
    conn = sqlite3.connect('logs.db', check_same_thread=False)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            level TEXT,
            message TEXT,
            source TEXT
        )
    ''')
    cursor.execute("PRAGMA table_info(logs)")
    columns = [col[1] for col in cursor.fetchall()]
    if 'details' not in columns:
        cursor.execute("ALTER TABLE logs ADD COLUMN details TEXT DEFAULT ''")
        
    conn.commit()
    return conn

db = init_db()

# FIXED: Added the missing 'details' field here!
class LogEntry(BaseModel):
    level: str
    message: str
    source: str = "external_service"
    details: str = ""  # <-- THIS WAS MISSING

# Serve the frontend HTML
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    with open("templates/index.html", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

# FIXED: Removed the duplicate function. Only keeping the one that saves details.
@app.post("/api/logs")
def create_log(log: LogEntry):
    cursor = db.cursor()
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        "INSERT INTO logs (timestamp, level, message, source, details) VALUES (?, ?, ?, ?, ?)",
        (timestamp, log.level.upper(), log.message, log.source, log.details)
    )
    db.commit()
    return {"status": "success", "id": cursor.lastrowid}

# 2. Get recent logs (with optional level and search filters)
@app.get("/api/logs")
def get_logs(limit: int = 50, level: str = None, search: str = None):
    db.row_factory = sqlite3.Row
    cursor = db.cursor()
    
    query = "SELECT * FROM logs WHERE 1=1"
    params = []
    
    if level:
        query += " AND level = ?"
        params.append(level.upper())
    if search:
        query += " AND (message LIKE ? OR source LIKE ?)"
        search_term = f"%{search}%"
        params.extend([search_term, search_term])
    
    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    logs = [dict(row) for row in cursor.fetchall()]
    return logs

# 3. Get dashboard metrics
@app.get("/api/metrics")
def get_metrics():
    db.row_factory = sqlite3.Row
    cursor = db.cursor()
    cursor.execute("SELECT level, COUNT(*) as count FROM logs GROUP BY level")
    metrics = {row["level"]: row["count"] for row in cursor.fetchall()}
    
    cursor.execute("SELECT COUNT(*) FROM logs")
    metrics["total"] = cursor.fetchone()[0]
    
    for lvl in ["INFO", "WARNING", "ERROR", "DEBUG"]:
        if lvl not in metrics:
            metrics[lvl] = 0
            
    return metrics

# 4. Simulate random logs (for testing the UI)
@app.post("/api/simulate")
def simulate_log():
    levels = ["INFO", "INFO", "INFO", "WARNING", "ERROR", "DEBUG"]
    messages = [
        "User login successful",
        "Database connection timeout",
        "Cache miss for key: user_123",
        "High memory usage detected (>85%)",
        "Payment gateway response: 200 OK",
        "Failed to parse JSON payload"
    ]
    sources = ["auth_service", "db_worker", "cache_layer", "monitor_agent", "api_gateway"]
    
    details_templates = [
        '{"user_id": 12345, "ip": "192.168.1.1", "session_token": "abc123xyz"}',
        'Traceback (most recent call last):\n  File "db.py", line 42, in connect\n    raise ConnectionError("Timeout")\nConnectionError: Timeout after 30s',
        '{"cache_key": "user_123", "ttl": 3600, "status": "MISS"}',
        '{"memory_usage_mb": 8500, "threshold_mb": 8000, "process": "node"}',
        '{"status_code": 200, "response_time_ms": 145, "gateway": "stripe_v2"}',
        'SyntaxError: Unexpected token < in JSON at position 0\n  at JSON.parse (<anonymous>)'
    ]
    
    log = LogEntry(
        level=random.choice(levels),
        message=random.choice(messages),
        source=random.choice(sources),
        details=random.choice(details_templates)
    )
    return create_log(log)

# 5. Clear all logs
@app.delete("/api/logs")
def clear_logs():
    cursor = db.cursor()
    cursor.execute("DELETE FROM logs")
    db.commit()
    return {"status": "success", "message": "All logs cleared"}

# 6. Get System Metrics (CPU, RAM, Disk)
@app.get("/api/system-metrics")
def get_system_metrics():
    cpu_percent = psutil.cpu_percent(interval=None)
    
    ram = psutil.virtual_memory()
    ram_percent = ram.percent
    ram_used = round(ram.used / (1024 ** 3), 2)
    ram_total = round(ram.total / (1024 ** 3), 2)
    
    root_path = os.path.abspath(os.sep) 
    disk = psutil.disk_usage(root_path)
    disk_percent = disk.percent
    disk_used = round(disk.used / (1024 ** 3), 2)
    disk_total = round(disk.total / (1024 ** 3), 2)

    return {
        "cpu": cpu_percent,
        "ram_percent": ram_percent,
        "ram_used": ram_used,
        "ram_total": ram_total,
        "disk_percent": disk_percent,
        "disk_used": disk_used,
        "disk_total": disk_total
    }