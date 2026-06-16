from flask import Flask, render_template, jsonify
import requests
import xml.etree.ElementTree as ET
from datetime import datetime
import html
import re

app = Flask(__name__)

BQ_FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def strip_html(text: str) -> str:
    """Remove HTML tags and decode HTML entities from a string."""
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def format_date(date_str: str) -> str:
    """Parse an ISO-8601 or RFC-822 date string and return a human-readable form."""
    if not date_str:
        return ""
    date_str = date_str.strip()
    formats = [
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S+00:00",
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%a, %d %b %Y %H:%M:%S %z",
        "%a, %d %b %Y %H:%M:%S GMT",
        "%Y-%m-%d",
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str[: len(fmt) + 6].strip(), fmt)
            return dt.strftime("%b %d, %Y")
        except ValueError:
            continue
    return date_str[:10] if len(date_str) >= 10 else date_str


def parse_feed(xml_text: str):
    """Parse Atom / RSS XML and return (list[dict], error_str | None)."""
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError as exc:
        return [], f"XML parse error: {exc}"

    entries = []

    # ---- Atom feed ---------------------------------------------------------
    atom_ns = "http://www.w3.org/2005/Atom"
    if root.tag == f"{{{atom_ns}}}feed" or root.tag.startswith(f"{{{atom_ns}}}"):
        ns = {"a": atom_ns}
        for entry in root.findall("a:entry", ns):
            title_el   = entry.find("a:title",   ns)
            summary_el = entry.find("a:summary", ns)
            content_el = entry.find("a:content", ns)
            link_el    = entry.find("a:link",    ns)
            updated_el = entry.find("a:updated", ns)

            raw_body = ""
            if content_el is not None and content_el.text:
                raw_body = content_el.text
            elif summary_el is not None and summary_el.text:
                raw_body = summary_el.text

            title   = strip_html(title_el.text   if title_el   is not None else "No title")
            summary = strip_html(raw_body)
            link    = link_el.get("href", "#")   if link_el   is not None else "#"
            date_str = updated_el.text            if updated_el is not None else ""

            entries.append({
                "title":    title,
                "summary":  summary,
                "link":     link,
                "date":     format_date(date_str),
                "raw_date": date_str,
            })
        return entries, None

    # ---- RSS 2.0 feed ------------------------------------------------------
    channel = root.find("channel")
    if channel is not None:
        for item in channel.findall("item"):
            title_el = item.find("title")
            desc_el  = item.find("description")
            link_el  = item.find("link")
            pub_el   = item.find("pubDate")

            title    = strip_html(title_el.text if title_el is not None else "No title")
            summary  = strip_html(desc_el.text  if desc_el  is not None else "")
            link     = (link_el.text or "#")    if link_el  is not None else "#"
            date_str = (pub_el.text  or "")     if pub_el   is not None else ""

            entries.append({
                "title":    title,
                "summary":  summary,
                "link":     link,
                "date":     format_date(date_str),
                "raw_date": date_str,
            })
        return entries, None

    return [], "Unrecognised feed format."


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/release-notes")
def release_notes():
    """Proxy the BigQuery release-notes feed and return JSON."""
    try:
        resp = requests.get(
            BQ_FEED_URL,
            timeout=15,
            headers={"User-Agent": "BigQuery-Release-Notes-Viewer/1.0"},
        )
        resp.raise_for_status()
    except requests.RequestException as exc:
        return jsonify({"error": f"Failed to fetch feed: {exc}"}), 502

    entries, err = parse_feed(resp.text)
    if err:
        return jsonify({"error": err}), 500

    return jsonify({"entries": entries, "count": len(entries)})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
