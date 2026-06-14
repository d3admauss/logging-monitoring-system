# Real-Time Logging & Monitoring Dashboard

A full-stack web application built with **Python (FastAPI)** and **Vanilla JavaScript** to monitor system logs, track server hardware metrics, and visualize data in real-time. 

Designed with a sleek, animated dark-mode UI, this dashboard provides a professional developer experience for debugging and system monitoring.

![Dashboard UI](https://img.shields.io/badge/UI-Tailwind_CSS-blue) ![Backend](https://img.shields.io/badge/Backend-FastAPI-green) ![Database](https://img.shields.io/badge/DB-SQLite-orange)

<img width="1829" height="955" alt="{E5F84B9C-A4A6-4301-89BE-4CB155E62CA2}" src="https://github.com/user-attachments/assets/ea1fbaa9-ea20-4383-9476-ee88075a670b" />

---

## Features

### System Monitoring
- **Live Hardware Metrics:** Real-time tracking of **CPU**, **RAM**, and **Disk Space** usage with animated progress bars.
- **Auto-Refresh:** Updates system stats every second without blocking the server.

### Log Management
- **Real-Time Aggregation:** View logs as they are ingested with smooth fade-in animations.
- **Auto-Log Simulator:** Built-in tool to generate random logs (INFO, WARNING, ERROR, DEBUG) to test the UI.
- **Expandable Rows:** Click any log row to expand it and view raw details, JSON payloads, or Python stack traces.
- **Copy to Clipboard:** One-click button to copy expanded log details to your clipboard.

### Advanced Filtering & Search
- **Level Filtering:** Click the metric cards (Total, Info, Warnings, Errors) to instantly filter the table.
- **Text Search:** Debounced search bar to filter logs by message content or source (e.g., searching "timeout" or "auth_service").
- **Dynamic Limit Slider:** Adjust the number of displayed logs on the fly (from 10 up to 200) using a smooth slider.

### Data Export
- **JSON & CSV Export:** Download your currently filtered logs instantly in structured JSON or spreadsheet-ready CSV format.

### Pro Keyboard Shortcuts
- Press **`/`** to instantly focus the search bar.
- Press **`Space`** to toggle the Auto-Log simulator on/off.
- Press **`Esc`** to clear the search and blur the input.

### UI/UX
- **Dark Blue Theme:** Modern, glassmorphism-inspired dark mode.
- **Smooth Animations:** Number pop effects, hover states, and loading transitions.
- **Fully Responsive:** Works beautifully on desktop and mobile screens.

---

## Tech Stack

| Component | Technology |
| :--- | :--- |
| **Backend Framework** | Python, FastAPI |
| **Database** | SQLite3 (via Python standard library) |
| **System Metrics** | `psutil` |
| **Frontend** | Vanilla JavaScript (ES6+) |
| **Styling** | Tailwind CSS (via CDN) |
| **Server** | Uvicorn (ASGI) |

---

## Getting Started

Follow these steps to run the project locally on your machine.

### Prerequisites
- Python 3.8 or higher installed on your system.
- `pip` (Python package manager).

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/d3admauss/logging-monitoring-system.git
cd logging-monitoring-system
```

### 2. Create a Virtual Environment

It is highly recommended to use a virtual environment to keep dependencies isolated.

#### Windows

```bash
python -m venv .venv
.venv\Scripts\activate
```

#### macOS / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the Server

Start the FastAPI backend using Uvicorn. We use `--log-level warning` to keep the terminal clean from HTTP polling spam.

```bash
uvicorn main:app --reload --log-level warning
```

### 5. Open the Dashboard

Open your web browser and navigate to:

```
http://127.0.0.1:8000
```
