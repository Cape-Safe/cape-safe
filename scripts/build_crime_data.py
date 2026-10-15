"""Rebuild src/data/crime.ts from the SAPS Annual Crime Records CSV (DataFirst, CC-BY).

Usage:  python3 scripts/build_crime_data.py path/to/sapacr-2005-2026-v1.5.csv
Needs:  pip install pandas numpy
Edit YEARS, GROUPS (crime columns, severity weight, hourly peaks) below to change the model.
"""
import math, sys
import numpy as np
import pandas as pd

CSV = sys.argv[1]
OUT = "src/data/crime.ts"
YEARS = ["2023/2024", "2024/2025", "2025/2026"]  # 2025/2026 is annualised by DataFirst
# name: (crime columns, severity weight, [(peak hour, spread in hours)], floor)
GROUPS = {
    "violent": (["murder", "attempted_murder", "assault_gbh", "common_assault", "sexual_offences"], 3.0, [(23, 3.5)], 0.25),
    "robbery": (["aggr_robbery", "common_robbery"], 2.0, [(14, 3.5), (20, 3.0)], 0.30),
    "theft": (["theft_from_vehicle", "vehicle_theft", "other_theft"], 1.0, [(12.5, 3.0), (18, 3.0)], 0.30),
}

df = pd.read_csv(CSV, na_values=["NA"])
for c in ("longitude", "latitude"):  # the CSV uses decimal commas
    df[c] = df[c].astype(str).str.replace(",", ".").astype(float)
ct = df[(df.dc_mn.str.lower() == "city of cape town") & df.year.isin(YEARS)]
cols = {c: "mean" for g in GROUPS.values() for c in g[0]}
st = ct.groupby("station").agg({**cols, "longitude": "first", "latitude": "first"}).reset_index()

def profile(peaks, floor):  # hourly multiplier with mean 1, so the daily total is unchanged
    h = np.arange(24)
    p = np.full(24, floor, float)
    for mu, sg in peaks:
        d = np.abs(h - mu); d = np.minimum(d, 24 - d)
        p += np.exp(-d ** 2 / (2 * sg ** 2))
    return p / p.mean()

H = np.zeros((len(st), 24)); annual = np.zeros(len(st))
for crime_cols, weight, peaks, floor in GROUPS.values():
    n = st[crime_cols].sum(axis=1).values
    H += weight * np.outer(n, profile(peaks, floor))
    annual += n
H /= H.max()

def hav(a, b):
    r = math.radians
    h = math.sin(r(b[0] - a[0]) / 2) ** 2 + math.cos(r(a[0])) * math.cos(r(b[0])) * math.sin(r(b[1] - a[1]) / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(h))

pts = list(zip(st.latitude, st.longitude))
rows = []
for i, r in st.iterrows():
    nn = min(hav(pts[i], q) for j, q in enumerate(pts) if j != i)
    radius = int(round(min(4500, max(1500, 0.9 * nn)), -2))  # blob size follows station spacing
    name = r.station.title().replace("'S", "'s")
    hourly = ", ".join(str(round(float(x), 2)) for x in H[i])
    rows.append(f'  {{ id: "s{i+1}", name: "{name}", coordinates: {{ latitude: {round(r.latitude,5)}, longitude: {round(r.longitude,5)} }}, radius: {radius}, annual: {int(round(annual[i]))},\n    hourly: [{hourly}] }},')

head = open(OUT).read().split("export const HEAT_POINTS")[0]
open(OUT, "w").write(head + "export const HEAT_POINTS: HeatPoint[] = [\n" + "\n".join(rows) + "\n];\n")
print(f"Wrote {len(rows)} stations to {OUT}")
