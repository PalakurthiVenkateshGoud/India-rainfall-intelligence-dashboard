# 🇮🇳 India Rainfall Intelligence Dashboard

An interactive data analytics dashboard for exploring India's historical rainfall patterns, regional variation, seasonal dynamics, climatological normals, and rainfall risk using historical IMD rainfall datasets.

## 🌐 Live Demo

**[Open the India Rainfall Intelligence Dashboard](https://india-rainfall-intelligence.netlify.app/)**

The dashboard analyzes rainfall data from **1901–2015** and provides both national historical analysis and district-level climatological insights.

## 📊 Key Highlights

- **115 years** of historical rainfall analysis (1901–2015)
- **4,116 historical observations**
- **36 IMD meteorological subdivisions**
- **641 district rainfall normal records**
- Annual and Southwest Monsoon rainfall trends
- Year-wise rainfall anomaly and IMD classification
- Decadal rainfall comparison
- Regional rainfall time-series analysis
- 12-month rainfall patterns
- Seasonal rainfall distribution
- District and state-level rainfall normals
- Wettest and driest region/district rankings
- Historical rainfall extremes
- Rainfall volatility using **Coefficient of Variation (CV%)**
- Historical deficient and scanty rainfall frequency
- Methodology and data dictionary

## 🗂️ Datasets

### Dataset 1 — Historical Rainfall

`rainfall in india 1901-2015.csv`

- 4,116 rows × 19 columns
- Covers 1901–2015
- Contains monthly, seasonal, monsoon, and annual rainfall observations
- Used for historical trends, anomalies, drought frequency, moving averages, and rainfall volatility analysis

### Dataset 2 — District Rainfall Normals

`district wise rainfall normal.csv`

- 641 district records
- Covers 35 States/UTs
- Contains long-term climatological rainfall normals
- Used for state/district comparisons, monthly normals, seasonal analysis, and intra-state rainfall disparity

## 📈 Dashboard Sections

### 🏛️ Executive Overview
Provides a national-level view of long-term rainfall trends, monsoon contribution, anomalies, and decadal patterns.

### 🗺️ Historical Subdivision Analysis
Explore rainfall trends for India's 36 IMD meteorological subdivisions, including:

- Annual rainfall
- Southwest Monsoon rainfall
- Moving averages
- Monthly rainfall normals
- Seasonal distribution
- Wettest and driest years
- Rainfall volatility
- Historical climate heatmap

### 📍 District & State Normals
Explore district-level climatological normals with state and district comparisons, including:

- Annual rainfall normal
- Monthly rainfall curve
- Monsoon share
- Seasonal distribution
- State average normal
- Wettest and driest districts
- Intra-state rainfall disparity
- National district rankings

### 🌦️ Seasonal & Monsoon Dynamics
Analyzes India's four meteorological seasons:

- Winter
- Pre-Monsoon
- Southwest Monsoon
- Post-Monsoon

The dashboard also compares different regional rainfall regimes across India.

### ⚠️ Climate Extremes & Risk
Highlights:

- Wettest historical subdivision-years
- Driest historical subdivision-years
- Rainfall volatility
- Drought and deficient rainfall frequency
- High-variability rainfall regions

### 📖 Methodology & Data Dictionary
Documents the datasets, calculated metrics, rainfall classifications, formulas, and missing-data handling.

## 📐 Methodology

### Rainfall Departure

```text
Departure (%) =
((Observed Rainfall - Normal Baseline) / Normal Baseline) × 100
```

### IMD Rainfall Classification

| Classification | Departure |
|---|---:|
| Excess | ≥ +20% |
| Normal | −19% to +19% |
| Deficient | −20% to −59% |
| Scanty | ≤ −60% |

### Coefficient of Variation

```text
CV (%) = (Standard Deviation / Mean) × 100
```

A higher CV indicates greater year-to-year rainfall variability.

Missing values are preserved as nulls and excluded from aggregations rather than being treated as zero.

## 🗃️ Project Structure

```text
India-rainfall-intelligence-dashboard/
│
├── index.html
├── css/
├── js/
├── Images/
├── data_processed/
├── scripts/
├── projects/
│   └── india_rainfall_analysis_dashboard/
│
├── district wise rainfall normal.csv
└── rainfall in india 1901-2015.csv
```

## 🎯 Project Objective

The goal of this project is to transform historical Indian rainfall datasets into an interactive analytical platform that makes long-term rainfall patterns easier to explore and understand.

It can be useful for:

- Climate and rainfall analysis
- Data visualization
- Agricultural and water-resource insights
- Regional rainfall comparison
- Drought-risk exploration
- Data analytics portfolios and academic projects

## 🚀 Live Application

👉 **[Launch the Dashboard](https://india-rainfall-intelligence.netlify.app/)**

## 📚 Data Source

The dashboard uses historical rainfall observations and climatological normal data associated with the **India Meteorological Department (IMD)** datasets included in this repository.



---

⭐ If you find this project useful, consider giving the repository a star.
