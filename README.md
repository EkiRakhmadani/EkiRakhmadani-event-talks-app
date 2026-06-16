# BigQuery Release Notes Dashboard

> A lightweight Flask web application that fetches, parses, and displays the official **Google Cloud BigQuery release notes** feed — with one-click sharing to X (Twitter).

---

## ✨ Features

- 📡 **Live feed** — proxies the official Atom feed from `docs.cloud.google.com` and serves clean JSON
- 🃏 **Card grid UI** — each release note displayed as a hoverable card with title, date, summary, and a direct link
- 🔄 **Refresh on demand** — animated spinner button re-fetches the latest notes at any time
- 🐦 **Share on X / Twitter** — click any card to open a pre-filled tweet composer (editable, 280-char counter)
- ⌨️ **Keyboard shortcuts** — `R` to refresh, `Esc` to close the share modal
- 📱 **Responsive** — single-column layout on mobile, auto-fill grid on desktop
- 🎨 **Dark glassmorphism design** — Google-blue accents, smooth hover animations, sticky header

---

## 🖼️ Preview

| State | Description |
|---|---|
| **Initial** | Landing prompt with a "Load Release Notes" CTA |
| **Loading** | Animated spinner while the feed is being fetched |
| **Success** | Card grid with all 30 latest release notes |
| **Share modal** | Pre-filled tweet composer with character counter |

---

## 🗂️ Project Structure

```
firstProject/
├── app.py                  # Flask server — feed proxy & XML parser
├── requirements.txt        # Python dependencies
├── .gitignore
├── templates/
│   └── index.html          # HTML shell (loaded once)
└── static/
    ├── style.css           # Dark glassmorphism styles
    └── script.js           # Async fetch, state machine, tweet modal
```

---

## ⚙️ How It Works

```
Browser  ──GET /──►  Flask  ──GET feed──►  docs.cloud.google.com
                       │                          │
                       │◄──── Atom XML ───────────┘
                       │
                   parse XML
                   strip HTML
                   format dates
                       │
Browser  ◄──JSON───────┘
  │
render cards
```

1. The browser loads the HTML shell once (`GET /`)
2. On refresh, JS calls `GET /api/release-notes`
3. Flask fetches the Atom XML from Google, parses it, strips HTML from summaries, normalises dates, and returns clean JSON
4. The browser renders release note cards — no XML ever reaches the client
5. Clicking **Share** opens a tweet composer using the `twitter.com/intent/tweet` Web Intent API — no Twitter credentials required

---

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- pip

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/EkiRakhmadani/EkiRakhmadani-event-talks-app.git
cd EkiRakhmadani-event-talks-app

# 2. Create and activate a virtual environment (recommended)
python3 -m venv .venv
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\activate         # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the development server
python app.py
```

Open your browser at **http://127.0.0.1:5000** and click **Load Release Notes**.

---

## 🔌 API Reference

### `GET /`
Returns the HTML application shell.

---

### `GET /api/release-notes`
Fetches, parses, and returns BigQuery release notes as JSON.

**Success Response — `200 OK`**
```json
{
  "count": 30,
  "entries": [
    {
      "title":    "June 15, 2026",
      "summary":  "BigQuery now supports...",
      "link":     "https://cloud.google.com/bigquery/docs/release-notes#june_15_2026",
      "date":     "Jun 15, 2026",
      "raw_date": "2026-06-15T00:00:00Z"
    }
  ]
}
```

**Error Responses**

| Status | Meaning |
|---|---|
| `502 Bad Gateway` | Could not reach `docs.cloud.google.com` |
| `500 Internal Server Error` | Feed fetched but XML could not be parsed |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Server** | Python 3, Flask 3, `requests`, `xml.etree.ElementTree` |
| **Client** | Vanilla HTML5, CSS3, JavaScript (ES2020, no frameworks) |
| **Fonts** | Inter — Google Fonts |
| **Feed source** | Google Cloud Atom feed (`docs.cloud.google.com`) |
| **Tweet sharing** | Twitter Web Intent API |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `R` | Refresh release notes (when not typing) |
| `Esc` | Close the share modal |

---

## 🔒 Security Notes

- All feed content is **HTML-stripped server-side** before being sent to the client
- All text is **HTML-escaped client-side** before DOM insertion — no XSS risk
- The Twitter share feature uses a **Web Intent URL** — no OAuth or credentials required
- The app never stores or logs any user data

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙋 Author

**Eki Rakhmadani** — [@EkiRakhmadani](https://github.com/EkiRakhmadani)
