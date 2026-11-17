#!/usr/bin/env python3
"""Fetch Sevier County Electric System (SCES) outage data and write data/power.json.

Runs every 15 minutes from .github/workflows/power.yml. No API key, no AI.
Source: the public feeds behind https://viewer.sces.net (the official SCES outage map).
"""
import json, os, sys, urllib.request
from datetime import datetime, timezone

BASE = "https://viewer.sces.net/data/"
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "power.json")
UA = {"User-Agent": "TheSmokiesBrief/1.0 (outage summary for local hosts)"}

def get(name):
    req = urllib.request.Request(BASE + name, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

def main():
    try:
        summary = get("outageSummary.json")
        outages = get("outages.json") or []
        polygons = get("outagePolygons.json") or []
        planned = get("plannedOutages.json") or []
    except Exception as e:  # keep the last good file if SCES is down
        print("SCES fetch failed, keeping previous power.json:", e, file=sys.stderr)
        return 0

    def pt(o):
        p = o.get("outagePoint") or {}
        return {
            "lat": p.get("lat"), "lng": p.get("lng"),
            "out": o.get("customersOutNow", 0),
            "affected": o.get("customersAffected", 0),
            "start": o.get("startTime"),
            "crew": bool(o.get("crewAssigned")),
            "verified": bool(o.get("verified")),
            "cause": o.get("cause"),
            "id": o.get("outageRecID"),
        }

    feats = []
    for p in polygons:
        g = p.get("points") or {}
        if not g.get("coordinates"):
            continue
        coords = [g["coordinates"]] if g.get("type") == "Polygon" else g["coordinates"]
        feats.append({"type": "Feature", "geometry": {"type": "MultiPolygon", "coordinates": coords},
                      "properties": {"id": p.get("outageRecId"), "out": p.get("outNow", 0)}})

    hourly = summary.get("hourlyCustomersOut") or []
    data = {
        "source": "Sevier County Electric System",
        "sourceUrl": "https://viewer.sces.net",
        "fetched": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "updated": summary.get("updateTime"),
        "outNow": summary.get("customersOutNow", 0),
        "served": summary.get("customersServed", 0),
        "hourly": [{"t": h.get("eventTime"), "n": h.get("customers", 0)} for h in hourly],
        "outages": [pt(o) for o in outages if (o.get("outagePoint") or {}).get("lat")],
        "planned": [pt(o) for o in planned if (o.get("outagePoint") or {}).get("lat")],
        "polygons": {"type": "FeatureCollection", "features": feats},
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(data, f, separators=(",", ":"))
    print(f"power.json: {data['outNow']} out of {data['served']}, {len(data['outages'])} outage points")
    return 0

if __name__ == "__main__":
    sys.exit(main())
