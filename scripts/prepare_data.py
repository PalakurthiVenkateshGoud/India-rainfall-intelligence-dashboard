import pandas as pd
import numpy as np
import json
import os

# Load both original CSV files without modifying them
df1 = pd.read_csv('rainfall in india 1901-2015.csv')
df2 = pd.read_csv('district wise rainfall normal.csv')

print("Loaded DF1:", df1.shape)
print("Loaded DF2:", df2.shape)

# Months and seasons
months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
seasons = ['Jan-Feb', 'Mar-May', 'Jun-Sep', 'Oct-Dec']

# 1. Executive Summary Stats
all_annual_records = df1['ANNUAL'].dropna()
national_annual_mean = float(all_annual_records.mean())
monsoon_share_pct = float((df1['Jun-Sep'] / df1['ANNUAL']).dropna().mean() * 100)

sub_annual_means = df1.groupby('SUBDIVISION')['ANNUAL'].mean().sort_values(ascending=False)
wettest_subdivision = {"name": sub_annual_means.index[0], "annual_mean": float(sub_annual_means.iloc[0])}
driest_subdivision = {"name": sub_annual_means.index[-1], "annual_mean": float(sub_annual_means.iloc[-1])}

dist_wettest = df2.sort_values('ANNUAL', ascending=False).iloc[0]
dist_driest = df2.sort_values('ANNUAL', ascending=True).iloc[0]
wettest_district = {"district": dist_wettest['DISTRICT'], "state": dist_wettest['STATE_UT_NAME'], "annual_normal": float(dist_wettest['ANNUAL'])}
driest_district = {"district": dist_driest['DISTRICT'], "state": dist_driest['STATE_UT_NAME'], "annual_normal": float(dist_driest['ANNUAL'])}

# 2. National annual & monsoon time series (1901-2015)
national_trend = []
for year, group in df1.groupby('YEAR'):
    ann_mean = float(group['ANNUAL'].dropna().mean())
    mon_mean = float(group['Jun-Sep'].dropna().mean())
    jf_mean = float(group['Jan-Feb'].dropna().mean())
    mam_mean = float(group['Mar-May'].dropna().mean())
    ond_mean = float(group['Oct-Dec'].dropna().mean())
    
    # monthly averages across all subdivisions
    m_means = {m: (float(group[m].dropna().mean()) if group[m].notna().any() else None) for m in months}
    
    national_trend.append({
        "year": int(year),
        "annual": round(ann_mean, 2),
        "monsoon": round(mon_mean, 2),
        "jan_feb": round(jf_mean, 2),
        "mar_may": round(mam_mean, 2),
        "oct_dec": round(ond_mean, 2),
        "months": m_means
    })

# Add long-term baseline and anomalies to national trend
lt_annual_baseline = np.mean([x['annual'] for x in national_trend])
lt_monsoon_baseline = np.mean([x['monsoon'] for x in national_trend])

for item in national_trend:
    item['annual_anomaly_mm'] = round(item['annual'] - lt_annual_baseline, 2)
    item['annual_anomaly_pct'] = round(((item['annual'] - lt_annual_baseline) / lt_annual_baseline) * 100, 2)
    item['monsoon_anomaly_mm'] = round(item['monsoon'] - lt_monsoon_baseline, 2)
    item['monsoon_anomaly_pct'] = round(((item['monsoon'] - lt_monsoon_baseline) / lt_monsoon_baseline) * 100, 2)
    
    # Classify IMD Anomaly
    # Excess: >= +20%, Normal: -19% to +19%, Deficient: -20% to -59%, Scanty: <= -60%
    pct = item['annual_anomaly_pct']
    if pct >= 20.0:
        item['category'] = 'Excess'
    elif pct >= -19.0:
        item['category'] = 'Normal'
    elif pct >= -59.0:
        item['category'] = 'Deficient'
    else:
        item['category'] = 'Scanty'

# 3. Decadal Comparison
decades = {}
for item in national_trend:
    dec = (item['year'] // 10) * 10
    dec_label = f"{dec}s"
    if dec_label not in decades:
        decades[dec_label] = {"years": [], "annual": [], "monsoon": []}
    decades[dec_label]["years"].append(item['year'])
    decades[dec_label]["annual"].append(item['annual'])
    decades[dec_label]["monsoon"].append(item['monsoon'])

decadal_summary = []
for dec_label, data in decades.items():
    decadal_summary.append({
        "decade": dec_label,
        "count": len(data['years']),
        "start_year": min(data['years']),
        "end_year": max(data['years']),
        "avg_annual": round(float(np.mean(data['annual'])), 2),
        "avg_monsoon": round(float(np.mean(data['monsoon'])), 2),
        "monsoon_share_pct": round(float((np.mean(data['monsoon']) / np.mean(data['annual'])) * 100), 2)
    })

# 4. Subdivision Historical Analytics (Dataset 1)
subdivisions_data = {}
subdivision_stats = []

for sub_name, group in df1.groupby('SUBDIVISION'):
    records = []
    annual_vals = group['ANNUAL'].dropna().values
    sub_mean_annual = float(np.mean(annual_vals)) if len(annual_vals) > 0 else 0
    sub_std_annual = float(np.std(annual_vals)) if len(annual_vals) > 0 else 0
    sub_cv = round((sub_std_annual / sub_mean_annual) * 100, 2) if sub_mean_annual > 0 else 0
    
    # Month normals for subdivision
    sub_month_normals = {}
    for m in months:
        mVals = group[m].dropna().values
        sub_month_normals[m] = round(float(np.mean(mVals)), 2) if len(mVals) > 0 else 0
        
    sub_season_normals = {}
    for s in seasons:
        sVals = group[s].dropna().values
        sub_season_normals[s] = round(float(np.mean(sVals)), 2) if len(sVals) > 0 else 0
    
    # Yearly records for this subdivision
    excess_count = 0
    normal_count = 0
    deficient_count = 0
    scanty_count = 0
    
    for _, row in group.sort_values('YEAR').iterrows():
        yr = int(row['YEAR'])
        ann = float(row['ANNUAL']) if pd.notna(row['ANNUAL']) else None
        mon = float(row['Jun-Sep']) if pd.notna(row['Jun-Sep']) else None
        
        # Calculate anomaly against subdivision's own long-term mean
        anom_pct = None
        cat = 'Unknown'
        if ann is not None and sub_mean_annual > 0:
            anom_pct = round(((ann - sub_mean_annual) / sub_mean_annual) * 100, 2)
            if anom_pct >= 20.0:
                cat = 'Excess'
                excess_count += 1
            elif anom_pct >= -19.0:
                cat = 'Normal'
                normal_count += 1
            elif anom_pct >= -59.0:
                cat = 'Deficient'
                deficient_count += 1
            else:
                cat = 'Scanty'
                scanty_count += 1
        
        m_dict = {m: (float(row[m]) if pd.notna(row[m]) else None) for m in months}
        s_dict = {s: (float(row[s]) if pd.notna(row[s]) else None) for s in seasons}
        
        records.append({
            "year": yr,
            "annual": ann,
            "monsoon": mon,
            "seasons": s_dict,
            "months": m_dict,
            "anomaly_pct": anom_pct,
            "category": cat
        })
    
    # Min and Max years
    valid_ann_rows = group.dropna(subset=['ANNUAL'])
    max_row = valid_ann_rows.loc[valid_ann_rows['ANNUAL'].idxmax()] if len(valid_ann_rows) > 0 else None
    min_row = valid_ann_rows.loc[valid_ann_rows['ANNUAL'].idxmin()] if len(valid_ann_rows) > 0 else None
    
    highest_year = {"year": int(max_row['YEAR']), "rainfall": float(max_row['ANNUAL'])} if max_row is not None else None
    lowest_year = {"year": int(min_row['YEAR']), "rainfall": float(min_row['ANNUAL'])} if min_row is not None else None
    
    sub_stat = {
        "name": sub_name,
        "record_count": len(group),
        "min_year": int(group['YEAR'].min()),
        "max_year": int(group['YEAR'].max()),
        "mean_annual": round(sub_mean_annual, 2),
        "std_annual": round(sub_std_annual, 2),
        "cv_pct": sub_cv,
        "monsoon_mean": round(float(group['Jun-Sep'].dropna().mean()), 2),
        "monsoon_share_pct": round(float((group['Jun-Sep'] / group['ANNUAL']).dropna().mean() * 100), 2),
        "highest_year": highest_year,
        "lowest_year": lowest_year,
        "drought_deficient_years": deficient_count + scanty_count,
        "excess_years": excess_count,
        "normal_years": normal_count,
        "deficient_years": deficient_count,
        "scanty_years": scanty_count,
        "month_normals": sub_month_normals,
        "season_normals": sub_season_normals
    }
    
    subdivision_stats.append(sub_stat)
    subdivisions_data[sub_name] = {
        "metadata": sub_stat,
        "time_series": records
    }

# 5. District & State Normals (Dataset 2)
# Check all rows
districts_list = []
states_data = {}

for idx, row in df2.iterrows():
    st = row['STATE_UT_NAME']
    dist = row['DISTRICT']
    ann = float(row['ANNUAL'])
    m_vals = {m: float(row[m]) for m in months}
    s_vals = {s: float(row[s]) for s in seasons}
    monsoon_pct = round((s_vals['Jun-Sep'] / ann) * 100, 2) if ann > 0 else 0
    
    dist_item = {
        "id": f"{st}__{dist}",
        "state": st,
        "district": dist,
        "display_name": f"{dist} ({st})",
        "annual": ann,
        "monsoon": s_vals['Jun-Sep'],
        "monsoon_share_pct": monsoon_pct,
        "seasons": s_vals,
        "months": m_vals
    }
    districts_list.append(dist_item)
    
    if st not in states_data:
        states_data[st] = {
            "state": st,
            "districts": [],
            "annual_vals": [],
            "monsoon_vals": [],
            "months_lists": {m: [] for m in months},
            "seasons_lists": {s: [] for s in seasons}
        }
    states_data[st]["districts"].append(dist_item)
    states_data[st]["annual_vals"].append(ann)
    states_data[st]["monsoon_vals"].append(s_vals['Jun-Sep'])
    for m in months:
        states_data[st]["months_lists"][m].append(m_vals[m])
    for s in seasons:
        states_data[st]["seasons_lists"][s].append(s_vals[s])

# Aggregate state stats
states_summary = []
for st, s_info in states_data.items():
    st_mean_ann = round(float(np.mean(s_info['annual_vals'])), 2)
    st_mean_mon = round(float(np.mean(s_info['monsoon_vals'])), 2)
    st_month_means = {m: round(float(np.mean(s_info['months_lists'][m])), 2) for m in months}
    st_season_means = {s: round(float(np.mean(s_info['seasons_lists'][s])), 2) for s in seasons}
    st_monsoon_share = round((st_season_means['Jun-Sep'] / st_mean_ann) * 100, 2) if st_mean_ann > 0 else 0
    
    # Wettest and driest district in state
    sorted_st_dists = sorted(s_info['districts'], key=lambda x: x['annual'], reverse=True)
    
    states_summary.append({
        "state": st,
        "district_count": len(s_info['districts']),
        "avg_annual": st_mean_ann,
        "avg_monsoon": st_mean_mon,
        "monsoon_share_pct": st_monsoon_share,
        "wettest_district": {"district": sorted_st_dists[0]['district'], "annual": sorted_st_dists[0]['annual']},
        "driest_district": {"district": sorted_st_dists[-1]['district'], "annual": sorted_st_dists[-1]['annual']},
        "range_diff": round(sorted_st_dists[0]['annual'] - sorted_st_dists[-1]['annual'], 2),
        "month_normals": st_month_means,
        "season_normals": st_season_means,
        "districts": s_info['districts']
    })

# 6. Rankings & Extremes
top_10_wettest_districts = sorted(districts_list, key=lambda x: x['annual'], reverse=True)[:10]
top_10_driest_districts = sorted(districts_list, key=lambda x: x['annual'])[:10]

top_5_wettest_subs = sorted(subdivision_stats, key=lambda x: x['mean_annual'], reverse=True)[:5]
top_5_driest_subs = sorted(subdivision_stats, key=lambda x: x['mean_annual'])[:5]
highest_cv_subs = sorted(subdivision_stats, key=lambda x: x['cv_pct'], reverse=True)
lowest_cv_subs = sorted(subdivision_stats, key=lambda x: x['cv_pct'])

# Extreme Subdivision-Years
valid_sub_years = []
for _, row in df1.dropna(subset=['ANNUAL']).iterrows():
    valid_sub_years.append({
        "subdivision": row['SUBDIVISION'],
        "year": int(row['YEAR']),
        "annual": float(row['ANNUAL']),
        "monsoon": float(row['Jun-Sep']) if pd.notna(row['Jun-Sep']) else None
    })

top_10_extreme_wet_years = sorted(valid_sub_years, key=lambda x: x['annual'], reverse=True)[:10]
top_10_extreme_dry_years = sorted(valid_sub_years, key=lambda x: x['annual'])[:10]

# 7. Package complete payload
dashboard_payload = {
    "generated_at": "2026-09-11",
    "kpis": {
        "long_term_annual_mean": round(national_annual_mean, 2),
        "monsoon_share_pct": round(monsoon_share_pct, 2),
        "total_years": 115,
        "year_min": 1901,
        "year_max": 2015,
        "total_historical_records": len(df1),
        "total_subdivisions": len(subdivision_stats),
        "total_states": len(states_summary),
        "total_districts": len(districts_list),
        "wettest_subdivision": wettest_subdivision,
        "driest_subdivision": driest_subdivision,
        "wettest_district": wettest_district,
        "driest_district": driest_district
    },
    "national_trend": national_trend,
    "decadal_summary": decadal_summary,
    "subdivisions_data": subdivisions_data,
    "subdivision_stats": subdivision_stats,
    "districts_list": districts_list,
    "states_summary": states_summary,
    "rankings": {
        "top_10_wettest_districts": top_10_wettest_districts,
        "top_10_driest_districts": top_10_driest_districts,
        "top_5_wettest_subs": top_5_wettest_subs,
        "top_5_driest_subs": top_5_driest_subs,
        "highest_cv_subs": highest_cv_subs,
        "top_10_extreme_wet_years": top_10_extreme_wet_years,
        "top_10_extreme_dry_years": top_10_extreme_dry_years
    },
    "constants": {
        "months": months,
        "seasons": seasons
    }
}

os.makedirs('data_processed', exist_ok=True)
with open('data_processed/rainfall_data.json', 'w') as f:
    json.dump(dashboard_payload, f, indent=2)

# Also write as a global JavaScript file so it can be loaded directly via <script src="..."> with 0 CORS issues
with open('data_processed/rainfall_data.js', 'w') as f:
    f.write("window.RAINFALL_DATA = " + json.dumps(dashboard_payload) + ";")

print("Successfully generated data_processed/rainfall_data.json and data_processed/rainfall_data.js")
print(f"Payload size: {os.path.getsize('data_processed/rainfall_data.json')} bytes")
