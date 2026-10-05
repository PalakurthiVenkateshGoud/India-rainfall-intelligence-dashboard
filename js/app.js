// India Rainfall Intelligence Dashboard | 1901-2015
// Core Application Engine

document.addEventListener('DOMContentLoaded', () => {
  if (!window.RAINFALL_DATA) {
    console.error("RAINFALL_DATA not loaded. Please ensure data_processed/rainfall_data.js is included.");
    return;
  }

  const data = window.RAINFALL_DATA;
  let chartInstances = {};

  // Color Constants
  const colors = {
    primary: '#0284c7',
    primaryAlpha: 'rgba(2, 132, 199, 0.25)',
    monsoon: '#06b6d4',
    monsoonAlpha: 'rgba(6, 182, 212, 0.25)',
    excess: '#10b981',
    normal: '#3b82f6',
    deficient: '#f59e0b',
    scanty: '#ef4444',
    purple: '#a855f7',
    gold: '#facc15',
    gridColor: 'rgba(255, 255, 255, 0.08)',
    textColor: '#94a3b8'
  };

  // ----------------------------------------------------
  // 1. Theme and Navigation
  // ----------------------------------------------------
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    themeToggleBtn.innerHTML = newTheme === 'light' ? '🌙' : '☀️';
    updateChartThemeColors(newTheme);
  });

  function updateChartThemeColors(theme) {
    const isLight = theme === 'light';
    colors.gridColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
    colors.textColor = isLight ? '#475569' : '#94a3b8';
    
    // Re-render active view
    renderExecutiveOverview();
    renderSubdivisionView();
    renderDistrictView();
    renderSeasonalView();
    renderExtremesView();
  }

  // Tab Navigation
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabPanes = document.querySelectorAll('.dashboard-tab-pane');

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      navTabs.forEach(t => t.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.add('active');
        // Trigger resize on charts in active pane
        window.dispatchEvent(new Event('resize'));
        if (targetId === 'subdivision-tab') {
          drawHeatmap();
        }
      }
    });
  });

  // ----------------------------------------------------
  // 2. Initialize Top KPIs
  // ----------------------------------------------------
  function initKPIs() {
    document.getElementById('kpi-annual-mean').textContent = data.kpis.long_term_annual_mean.toLocaleString();
    document.getElementById('kpi-monsoon-share').textContent = data.kpis.monsoon_share_pct + '%';
    
    document.getElementById('kpi-wettest-sub').textContent = data.kpis.wettest_subdivision.name;
    document.getElementById('kpi-wettest-val').textContent = data.kpis.wettest_subdivision.annual_mean.toFixed(1) + ' mm';
    
    document.getElementById('kpi-driest-sub').textContent = data.kpis.driest_subdivision.name;
    document.getElementById('kpi-driest-val').textContent = data.kpis.driest_subdivision.annual_mean.toFixed(1) + ' mm';

    document.getElementById('kpi-records-count').textContent = data.kpis.total_historical_records.toLocaleString();
    document.getElementById('kpi-years-span').textContent = `${data.kpis.year_min}–${data.kpis.year_max} (115 Yrs)`;
  }

  // ----------------------------------------------------
  // 3. Section 1: Executive Overview Charts
  // ----------------------------------------------------
  let execStartYear = 1901;
  let execEndYear = 2015;

  const execYearRange = document.getElementById('execYearRange');
  const execYearLabel = document.getElementById('execYearLabel');
  if (execYearRange) {
    execYearRange.addEventListener('input', (e) => {
      execStartYear = parseInt(e.target.value);
      execYearLabel.textContent = `${execStartYear} – 2015`;
      renderExecutiveOverview();
    });
  }

  function renderExecutiveOverview() {
    const filteredTrend = data.national_trend.filter(d => d.year >= execStartYear && d.year <= execEndYear);
    const years = filteredTrend.map(d => d.year);
    const annuals = filteredTrend.map(d => d.annual);
    const monsoons = filteredTrend.map(d => d.monsoon);

    // 10-year rolling moving average
    const rollingAvg = annuals.map((val, idx, arr) => {
      const start = Math.max(0, idx - 9);
      const windowSlice = arr.slice(start, idx + 1);
      const sum = windowSlice.reduce((a, b) => a + b, 0);
      return Math.round((sum / windowSlice.length) * 10) / 10;
    });

    // 1. All-India 115-Year Trendline Chart
    const ctxTrend = document.getElementById('execTrendChart');
    if (ctxTrend) {
      if (chartInstances.execTrend) chartInstances.execTrend.destroy();
      chartInstances.execTrend = new Chart(ctxTrend, {
        type: 'line',
        data: {
          labels: years,
          datasets: [
            {
              label: 'Annual Observed Mean (mm)',
              data: annuals,
              borderColor: colors.primary,
              backgroundColor: colors.primaryAlpha,
              borderWidth: 2,
              fill: false,
              tension: 0.15,
              pointRadius: 2,
              pointHoverRadius: 6
            },
            {
              label: 'Monsoon (Jun-Sep) (mm)',
              data: monsoons,
              borderColor: colors.monsoon,
              backgroundColor: colors.monsoonAlpha,
              borderWidth: 1.8,
              fill: false,
              tension: 0.15,
              pointRadius: 1,
              pointHoverRadius: 5
            },
            {
              label: '10-Yr Rolling Avg (mm)',
              data: rollingAvg,
              borderColor: colors.gold,
              borderWidth: 2.5,
              borderDash: [4, 4],
              fill: false,
              tension: 0.3,
              pointRadius: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { labels: { color: colors.textColor, font: { family: 'Outfit, sans-serif', size: 11 } } },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              titleColor: '#fff',
              bodyColor: '#e2e8f0',
              borderColor: 'rgba(56, 189, 248, 0.3)',
              borderWidth: 1,
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} mm`
              }
            }
          },
          scales: {
            x: { grid: { color: colors.gridColor }, ticks: { color: colors.textColor, maxTicksLimit: 14 } },
            y: { grid: { color: colors.gridColor }, ticks: { color: colors.textColor }, title: { display: true, text: 'Rainfall (mm)', color: colors.textColor } }
          }
        }
      });
    }

    // 2. Year-wise Anomaly Bar Chart (Diverging)
    const ctxAnomaly = document.getElementById('execAnomalyChart');
    if (ctxAnomaly) {
      if (chartInstances.execAnomaly) chartInstances.execAnomaly.destroy();
      
      const anomaliesPct = filteredTrend.map(d => d.annual_anomaly_pct);
      const bgColors = anomaliesPct.map(v => {
        if (v >= 20.0) return colors.excess; // Excess (+20%+)
        if (v >= 0.0) return colors.normal;  // Normal Positive
        if (v >= -19.0) return '#60a5fa';    // Normal Negative
        if (v >= -59.0) return colors.deficient; // Deficient (-20% to -59%)
        return colors.scanty; // Scanty (<= -60%)
      });

      chartInstances.execAnomaly = new Chart(ctxAnomaly, {
        type: 'bar',
        data: {
          labels: years,
          datasets: [{
            label: 'Departure from Long-Term Mean (%)',
            data: anomaliesPct,
            backgroundColor: bgColors,
            borderRadius: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const val = ctx.raw;
                  const item = filteredTrend[ctx.dataIndex];
                  return [`Departure: ${val > 0 ? '+' : ''}${val}%`, `Observed: ${item.annual} mm (Cat: ${item.category})`];
                }
              }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: colors.textColor, maxTicksLimit: 14 } },
            y: {
              grid: { color: colors.gridColor },
              ticks: { color: colors.textColor, callback: (v) => `${v}%` },
              title: { display: true, text: 'Anomaly Departure (%)', color: colors.textColor }
            }
          }
        }
      });
    }

    // 3. Decadal Comparison Chart
    const ctxDecade = document.getElementById('execDecadalChart');
    if (ctxDecade) {
      if (chartInstances.execDecade) chartInstances.execDecade.destroy();
      
      const decLabels = data.decadal_summary.map(d => d.decade);
      const decAnnual = data.decadal_summary.map(d => d.avg_annual);
      const decMonsoon = data.decadal_summary.map(d => d.avg_monsoon);

      chartInstances.execDecade = new Chart(ctxDecade, {
        type: 'bar',
        data: {
          labels: decLabels,
          datasets: [
            {
              label: 'Decadal Avg Annual (mm)',
              data: decAnnual,
              backgroundColor: colors.primary,
              borderRadius: 4
            },
            {
              label: 'Decadal Avg Monsoon (mm)',
              data: decMonsoon,
              backgroundColor: colors.monsoon,
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: colors.textColor } },
            tooltip: {
              callbacks: {
                afterBody: (ctx) => {
                  const dIdx = ctx[0].dataIndex;
                  const item = data.decadal_summary[dIdx];
                  return `Monsoon Share: ${item.monsoon_share_pct}%\nYears Span: ${item.start_year}-${item.end_year}`;
                }
              }
            }
          },
          scales: {
            x: { grid: { color: colors.gridColor }, ticks: { color: colors.textColor } },
            y: { grid: { color: colors.gridColor }, ticks: { color: colors.textColor }, title: { display: true, text: 'Decadal Mean (mm)', color: colors.textColor } }
          }
        }
      });
    }
  }

  // ----------------------------------------------------
  // 4. Section 2: Historical Subdivision Analysis (Dataset 1)
  // ----------------------------------------------------
  const subSelect = document.getElementById('subSelect');
  const subYearRange = document.getElementById('subYearRange');
  const subYearLabel = document.getElementById('subYearLabel');
  let currentSub = "KERALA";
  let subStartYear = 1901;

  // Populate Subdivision dropdown
  if (subSelect) {
    subSelect.innerHTML = '';
    const sortedSubNames = Object.keys(data.subdivisions_data).sort();
    sortedSubNames.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      if (name === "KERALA") opt.selected = true;
      subSelect.appendChild(opt);
    });

    subSelect.addEventListener('change', (e) => {
      currentSub = e.target.value;
      renderSubdivisionView();
    });
  }

  if (subYearRange) {
    subYearRange.addEventListener('input', (e) => {
      subStartYear = parseInt(e.target.value);
      subYearLabel.textContent = `${subStartYear} – 2015`;
      renderSubdivisionView();
    });
  }

  function renderSubdivisionView() {
    const subObj = data.subdivisions_data[currentSub];
    if (!subObj) return;

    const meta = subObj.metadata;
    
    // Update Subdivision Quick Badges
    document.getElementById('sub-badge-mean').textContent = meta.mean_annual.toFixed(1) + ' mm';
    document.getElementById('sub-badge-cv').textContent = meta.cv_pct + '%';
    document.getElementById('sub-badge-monsoon').textContent = meta.monsoon_share_pct + '%';
    document.getElementById('sub-badge-highest').textContent = meta.highest_year ? `${meta.highest_year.rainfall} mm (${meta.highest_year.year})` : 'N/A';
    document.getElementById('sub-badge-lowest').textContent = meta.lowest_year ? `${meta.lowest_year.rainfall} mm (${meta.lowest_year.year})` : 'N/A';
    document.getElementById('sub-badge-droughts').textContent = meta.drought_deficient_years + ' Years';

    const filteredSeries = subObj.time_series.filter(d => d.year >= subStartYear);
    const years = filteredSeries.map(d => d.year);
    const annualVals = filteredSeries.map(d => d.annual);
    const monsoonVals = filteredSeries.map(d => d.monsoon);

    // 5-Year Rolling Average for Subdivision
    const rollingSub = annualVals.map((val, idx, arr) => {
      const start = Math.max(0, idx - 4);
      const windowSlice = arr.slice(start, idx + 1).filter(v => v !== null);
      if (windowSlice.length === 0) return null;
      const sum = windowSlice.reduce((a, b) => a + b, 0);
      return Math.round((sum / windowSlice.length) * 10) / 10;
    });

    // 1. Subdivision Annual Trend Chart
    const ctxSubTrend = document.getElementById('subTrendChart');
    if (ctxSubTrend) {
      if (chartInstances.subTrend) chartInstances.subTrend.destroy();
      chartInstances.subTrend = new Chart(ctxSubTrend, {
        type: 'line',
        data: {
          labels: years,
          datasets: [
            {
              label: `${currentSub} Annual (mm)`,
              data: annualVals,
              borderColor: colors.primary,
              backgroundColor: colors.primaryAlpha,
              borderWidth: 2,
              fill: false,
              tension: 0.15,
              pointRadius: 2.5
            },
            {
              label: 'Monsoon (Jun-Sep) (mm)',
              data: monsoonVals,
              borderColor: colors.monsoon,
              borderWidth: 1.5,
              fill: false,
              tension: 0.15,
              pointRadius: 1
            },
            {
              label: '5-Yr Moving Avg (mm)',
              data: rollingSub,
              borderColor: colors.gold,
              borderWidth: 2,
              borderDash: [3, 3],
              pointRadius: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: colors.textColor } },
            tooltip: {
              callbacks: {
                afterBody: (ctx) => {
                  const item = filteredSeries[ctx[0].dataIndex];
                  return item.anomaly_pct !== null ? `Anomaly vs Normal: ${item.anomaly_pct > 0 ? '+' : ''}${item.anomaly_pct}% (${item.category})` : '';
                }
              }
            }
          },
          scales: {
            x: { grid: { color: colors.gridColor }, ticks: { color: colors.textColor, maxTicksLimit: 14 } },
            y: { grid: { color: colors.gridColor }, ticks: { color: colors.textColor }, title: { display: true, text: 'Rainfall (mm)', color: colors.textColor } }
          }
        }
      });
    }

    // 2. Subdivision Monthly Normal vs Year
    const ctxSubMonthly = document.getElementById('subMonthlyChart');
    if (ctxSubMonthly) {
      if (chartInstances.subMonthly) chartInstances.subMonthly.destroy();

      const mLabels = data.constants.months;
      const mNormals = mLabels.map(m => meta.month_normals[m]);
      
      // Latest selected year from series
      const latestRec = filteredSeries[filteredSeries.length - 1];
      const mLatest = latestRec ? mLabels.map(m => latestRec.months[m]) : [];

      chartInstances.subMonthly = new Chart(ctxSubMonthly, {
        type: 'bar',
        data: {
          labels: mLabels,
          datasets: [
            {
              label: '115-Yr Normal Baseline (mm)',
              data: mNormals,
              backgroundColor: colors.primaryAlpha,
              borderColor: colors.primary,
              borderWidth: 1.5,
              borderRadius: 4
            },
            {
              type: 'line',
              label: `${latestRec ? latestRec.year : 'Recent'} Observed Monthly (mm)`,
              data: mLatest,
              borderColor: colors.monsoon,
              backgroundColor: colors.monsoon,
              borderWidth: 2.5,
              pointRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: colors.textColor } }
          },
          scales: {
            x: { grid: { color: colors.gridColor }, ticks: { color: colors.textColor } },
            y: { grid: { color: colors.gridColor }, ticks: { color: colors.textColor }, title: { display: true, text: 'Monthly Rainfall (mm)', color: colors.textColor } }
          }
        }
      });
    }

    // 3. Subdivision Seasonal Breakdown
    const ctxSubSeasonal = document.getElementById('subSeasonalChart');
    if (ctxSubSeasonal) {
      if (chartInstances.subSeasonal) chartInstances.subSeasonal.destroy();
      
      const sLabels = ['Winter (Jan-Feb)', 'Pre-Monsoon (Mar-May)', 'Monsoon (Jun-Sep)', 'Post-Monsoon (Oct-Dec)'];
      const sKeys = ['Jan-Feb', 'Mar-May', 'Jun-Sep', 'Oct-Dec'];
      const sVals = sKeys.map(k => meta.season_normals[k]);

      chartInstances.subSeasonal = new Chart(ctxSubSeasonal, {
        type: 'doughnut',
        data: {
          labels: sLabels,
          datasets: [{
            data: sVals,
            backgroundColor: [
              '#38bdf8', // Winter
              '#facc15', // Pre-monsoon
              '#06b6d4', // Monsoon
              '#a855f7'  // Post-monsoon
            ],
            borderWidth: 2,
            borderColor: 'rgba(17, 24, 39, 0.85)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: colors.textColor, font: { size: 10 } } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const val = ctx.raw;
                  const total = sVals.reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                  return `${ctx.label}: ${val.toFixed(1)} mm (${pct}%)`;
                }
              }
            }
          }
        }
      });
    }

    // 4. Top/Bottom Subdivisions Rankings Bar
    renderSubdivisionRankings();
  }

  function renderSubdivisionRankings() {
    const ctxSubRank = document.getElementById('subRankingChart');
    if (!ctxSubRank) return;
    if (chartInstances.subRank) chartInstances.subRank.destroy();

    const top5Wet = data.rankings.top_5_wettest_subs;
    const top5Dry = data.rankings.top_5_driest_subs;
    const combined = [...top5Wet, ...top5Dry.slice().reverse()];

    const labels = combined.map(d => d.name);
    const vals = combined.map(d => d.mean_annual);
    const bgColors = combined.map((d, i) => i < 5 ? colors.excess : colors.deficient);

    chartInstances.subRank = new Chart(ctxSubRank, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Long-Term Mean Annual Rainfall (mm)',
          data: vals,
          backgroundColor: bgColors,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.raw.toFixed(1)} mm (CV: ${combined[ctx.dataIndex].cv_pct}%)`
            }
          }
        },
        scales: {
          x: { grid: { color: colors.gridColor }, ticks: { color: colors.textColor }, title: { display: true, text: 'Rainfall (mm)', color: colors.textColor } },
          y: { grid: { display: false }, ticks: { color: colors.textColor, font: { size: 10 } } }
        }
      }
    });
  }

  // ----------------------------------------------------
  // Interactive Canvas Heatmap (36 Subdivisions x 115 Years)
  // ----------------------------------------------------
  function drawHeatmap() {
    const canvas = document.getElementById('heatmapCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const tooltip = document.getElementById('heatmapTooltip');

    const subs = Object.keys(data.subdivisions_data).sort();
    const years = [];
    for (let y = 1901; y <= 2015; y++) years.push(y);

    const cellW = 10;
    const cellH = 14;
    const paddingLeft = 240;
    const paddingTop = 30;
    const width = paddingLeft + (years.length * cellW) + 20;
    const height = paddingTop + (subs.length * cellH) + 20;

    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, width, height);

    // Color map function (rainfall mm to color)
    function getColor(val) {
      if (val === null || val === undefined) return '#1f2937'; // Missing
      if (val < 400) return '#7f1d1d'; // extreme dry
      if (val < 800) return '#b45309'; // dry
      if (val < 1200) return '#0284c7'; // normal
      if (val < 2000) return '#06b6d4'; // wet
      if (val < 3200) return '#10b981'; // very wet
      return '#34d399'; // extreme wet
    }

    // Draw Years Header
    ctx.fillStyle = colors.textColor;
    ctx.font = '10px Outfit, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < years.length; i += 10) {
      const x = paddingLeft + (i * cellW) + (cellW / 2);
      ctx.fillText(years[i], x, paddingTop - 10);
    }

    // Grid lookup for tooltip
    const cellData = [];

    // Draw Rows
    for (let r = 0; r < subs.length; r++) {
      const subName = subs[r];
      const subObj = data.subdivisions_data[subName];
      const yPos = paddingTop + (r * cellH);

      // Label
      ctx.fillStyle = colors.textColor;
      ctx.font = '10px Outfit, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(subName, paddingLeft - 10, yPos + cellH - 3);

      // Create year lookup map
      const yrMap = {};
      subObj.time_series.forEach(item => {
        yrMap[item.year] = item;
      });

      for (let c = 0; c < years.length; c++) {
        const yr = years[c];
        const rec = yrMap[yr];
        const val = rec ? rec.annual : null;
        const xPos = paddingLeft + (c * cellW);

        ctx.fillStyle = getColor(val);
        ctx.fillRect(xPos, yPos, cellW - 1, cellH - 1);

        cellData.push({
          x: xPos,
          y: yPos,
          w: cellW,
          h: cellH,
          sub: subName,
          year: yr,
          val: val,
          anomaly: rec ? rec.anomaly_pct : null,
          category: rec ? rec.category : 'N/A'
        });
      }
    }

    // Heatmap interactive hover
    canvas.onmousemove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const hit = cellData.find(d => mouseX >= d.x && mouseX <= d.x + d.w && mouseY >= d.y && mouseY <= d.y + d.h);
      if (hit && tooltip) {
        tooltip.style.display = 'block';
        tooltip.style.left = (e.pageX + 15) + 'px';
        tooltip.style.top = (e.pageY - 25) + 'px';
        tooltip.innerHTML = `
          <strong>${hit.sub} (${hit.year})</strong><br/>
          Annual Rainfall: <span style="color:#38bdf8">${hit.val !== null ? hit.val.toFixed(1) + ' mm' : 'Missing Data'}</span><br/>
          Anomaly: <span style="color:${hit.anomaly >= 0 ? '#10b981' : '#f59e0b'}">${hit.anomaly !== null ? (hit.anomaly > 0 ? '+' : '') + hit.anomaly + '%' : 'N/A'}</span> (${hit.category})
        `;
      } else if (tooltip) {
        tooltip.style.display = 'none';
      }
    };

    canvas.onmouseleave = () => {
      if (tooltip) tooltip.style.display = 'none';
    };
  }

  // ----------------------------------------------------
  // 5. Section 3: District & State Rainfall Normals (Dataset 2)
  // ----------------------------------------------------
  const stateSelect = document.getElementById('stateSelect');
  const districtSelect = document.getElementById('districtSelect');
  let currentState = "KERALA";
  let currentDistrictId = "KERALA__WAYANAD";

  function initStateDistrictDropdowns() {
    if (!stateSelect || !districtSelect) return;

    stateSelect.innerHTML = '';
    data.states_summary.forEach(st => {
      const opt = document.createElement('option');
      opt.value = st.state;
      opt.textContent = `${st.state} (${st.district_count} Dists)`;
      if (st.state === "KERALA") opt.selected = true;
      stateSelect.appendChild(opt);
    });

    populateDistrictsForState(currentState);

    stateSelect.addEventListener('change', (e) => {
      currentState = e.target.value;
      populateDistrictsForState(currentState);
      renderDistrictView();
    });

    districtSelect.addEventListener('change', (e) => {
      currentDistrictId = e.target.value;
      renderDistrictView();
    });
  }

  function populateDistrictsForState(stName) {
    const stObj = data.states_summary.find(s => s.state === stName);
    districtSelect.innerHTML = '';
    if (!stObj || stObj.districts.length === 0) return;

    stObj.districts.forEach((d, idx) => {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = d.district;
      if (idx === 0) {
        opt.selected = true;
        currentDistrictId = d.id;
      }
      districtSelect.appendChild(opt);
    });
  }

  function renderDistrictView() {
    const stObj = data.states_summary.find(s => s.state === currentState);
    const distObj = data.districts_list.find(d => d.id === currentDistrictId) || (stObj ? stObj.districts[0] : null);
    if (!stObj || !distObj) return;

    // Update Badges
    document.getElementById('dist-badge-annual').textContent = distObj.annual.toFixed(1) + ' mm';
    document.getElementById('dist-badge-monsoon').textContent = distObj.monsoon_share_pct + '%';
    document.getElementById('dist-badge-state-avg').textContent = stObj.avg_annual.toFixed(1) + ' mm';
    document.getElementById('dist-badge-state-range').textContent = `${stObj.range_diff.toFixed(1)} mm`;
    document.getElementById('dist-badge-wet-dist').textContent = `${stObj.wettest_district.district} (${stObj.wettest_district.annual} mm)`;
    document.getElementById('dist-badge-dry-dist').textContent = `${stObj.driest_district.district} (${stObj.driest_district.annual} mm)`;

    const mLabels = data.constants.months;

    // 1. District vs State vs National Monthly Curve
    const ctxDistMonthly = document.getElementById('distMonthlyChart');
    if (ctxDistMonthly) {
      if (chartInstances.distMonthly) chartInstances.distMonthly.destroy();

      const distM = mLabels.map(m => distObj.months[m]);
      const stateM = mLabels.map(m => stObj.month_normals[m]);

      chartInstances.distMonthly = new Chart(ctxDistMonthly, {
        type: 'line',
        data: {
          labels: mLabels,
          datasets: [
            {
              label: `${distObj.district} Normal (mm)`,
              data: distM,
              borderColor: colors.primary,
              backgroundColor: colors.primaryAlpha,
              borderWidth: 2.5,
              fill: true,
              tension: 0.25,
              pointRadius: 4
            },
            {
              label: `${currentState} State Normal (mm)`,
              data: stateM,
              borderColor: colors.monsoon,
              borderWidth: 2,
              borderDash: [4, 4],
              fill: false,
              pointRadius: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: colors.textColor } },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} mm`
              }
            }
          },
          scales: {
            x: { grid: { color: colors.gridColor }, ticks: { color: colors.textColor } },
            y: { grid: { color: colors.gridColor }, ticks: { color: colors.textColor }, title: { display: true, text: 'Normal Rainfall (mm)', color: colors.textColor } }
          }
        }
      });
    }

    // 2. District Seasonal Normal Breakdown
    const ctxDistSeasonal = document.getElementById('distSeasonalChart');
    if (ctxDistSeasonal) {
      if (chartInstances.distSeasonal) chartInstances.distSeasonal.destroy();

      const sLabels = ['Winter (Jan-Feb)', 'Pre-Monsoon (Mar-May)', 'Monsoon (Jun-Sep)', 'Post-Monsoon (Oct-Dec)'];
      const sVals = [distObj.seasons['Jan-Feb'], distObj.seasons['Mar-May'], distObj.seasons['Jun-Sep'], distObj.seasons['Oct-Dec']];

      chartInstances.distSeasonal = new Chart(ctxDistSeasonal, {
        type: 'doughnut',
        data: {
          labels: sLabels,
          datasets: [{
            data: sVals,
            backgroundColor: ['#38bdf8', '#facc15', '#06b6d4', '#a855f7'],
            borderWidth: 2,
            borderColor: 'rgba(17, 24, 39, 0.85)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: colors.textColor, font: { size: 10 } } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const val = ctx.raw;
                  const pct = ((val / distObj.annual) * 100).toFixed(1);
                  return `${ctx.label}: ${val.toFixed(1)} mm (${pct}%)`;
                }
              }
            }
          }
        }
      });
    }

    // 3. Intra-State Disparity Bar Chart
    const ctxDistDisparity = document.getElementById('distDisparityChart');
    if (ctxDistDisparity) {
      if (chartInstances.distDisparity) chartInstances.distDisparity.destroy();

      const sortedDists = [...stObj.districts].sort((a, b) => b.annual - a.annual);
      const dNames = sortedDists.map(d => d.district);
      const dAnnuals = sortedDists.map(d => d.annual);
      const dColors = sortedDists.map(d => d.id === currentDistrictId ? colors.gold : colors.primary);

      chartInstances.distDisparity = new Chart(ctxDistDisparity, {
        type: 'bar',
        data: {
          labels: dNames,
          datasets: [{
            label: 'Normal Annual Rainfall (mm)',
            data: dAnnuals,
            backgroundColor: dColors,
            borderRadius: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const item = sortedDists[ctx.dataIndex];
                  return `Annual: ${item.annual} mm | Monsoon: ${item.monsoon} mm (${item.monsoon_share_pct}%)`;
                }
              }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: colors.textColor, font: { size: 9 }, maxRotation: 45, minRotation: 45 } },
            y: { grid: { color: colors.gridColor }, ticks: { color: colors.textColor }, title: { display: true, text: 'Rainfall (mm)', color: colors.textColor } }
          }
        }
      });
    }

    // 4. State-Level Comparison Chart
    renderStateLevelChart();

    // 5. Populate Top 10 Wettest & Driest District Leaderboards
    populateDistrictLeaderboards();
  }

  function renderStateLevelChart() {
    const ctxState = document.getElementById('stateRankChart');
    if (!ctxState) return;
    if (chartInstances.stateRank) chartInstances.stateRank.destroy();

    const sortedStates = [...data.states_summary].sort((a, b) => b.avg_annual - a.avg_annual);
    const sNames = sortedStates.map(s => s.state);
    const sVals = sortedStates.map(s => s.avg_annual);
    const sColors = sortedStates.map(s => s.state === currentState ? colors.gold : colors.primary);

    chartInstances.stateRank = new Chart(ctxState, {
      type: 'bar',
      data: {
        labels: sNames,
        datasets: [{
          label: 'State Avg Normal Annual (mm)',
          data: sVals,
          backgroundColor: sColors,
          borderRadius: 3
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const item = sortedStates[ctx.dataIndex];
                return `${item.avg_annual} mm (Monsoon Share: ${item.monsoon_share_pct}%, Dists: ${item.district_count})`;
              }
            }
          }
        },
        scales: {
          x: { grid: { color: colors.gridColor }, ticks: { color: colors.textColor }, title: { display: true, text: 'Rainfall (mm)', color: colors.textColor } },
          y: { grid: { display: false }, ticks: { color: colors.textColor, font: { size: 9 } } }
        }
      }
    });
  }

  function populateDistrictLeaderboards() {
    const wetList = document.getElementById('topWettestDistrictsList');
    const dryList = document.getElementById('topDriestDistrictsList');

    if (wetList) {
      wetList.innerHTML = '';
      data.rankings.top_10_wettest_districts.forEach((d, i) => {
        const item = document.createElement('div');
        item.className = 'ranking-item';
        item.innerHTML = `
          <div class="rank-left">
            <span class="rank-num">${i + 1}</span>
            <div class="rank-details">
              <div class="rank-name">${d.district}</div>
              <div class="rank-sub">${d.state}</div>
            </div>
          </div>
          <div class="rank-val">
            <div class="val-main">${d.annual.toLocaleString()} mm</div>
            <div class="val-share">Monsoon: ${d.monsoon_share_pct}%</div>
          </div>
        `;
        wetList.appendChild(item);
      });
    }

    if (dryList) {
      dryList.innerHTML = '';
      data.rankings.top_10_driest_districts.forEach((d, i) => {
        const item = document.createElement('div');
        item.className = 'ranking-item';
        item.innerHTML = `
          <div class="rank-left">
            <span class="rank-num">${i + 1}</span>
            <div class="rank-details">
              <div class="rank-name">${d.district}</div>
              <div class="rank-sub">${d.state}</div>
            </div>
          </div>
          <div class="rank-val">
            <div class="val-main">${d.annual.toLocaleString()} mm</div>
            <div class="val-share">Monsoon: ${d.monsoon_share_pct}%</div>
          </div>
        `;
        dryList.appendChild(item);
      });
    }
  }

  // ----------------------------------------------------
  // 6. Section 4: Seasonal & Monsoon Analysis
  // ----------------------------------------------------
  function renderSeasonalView() {
    const mLabels = data.constants.months;

    // 1. All-India 12-Month Progression
    const ctxMonthlyCycle = document.getElementById('seasonalMonthlyCycleChart');
    if (ctxMonthlyCycle) {
      if (chartInstances.seasonalCycle) chartInstances.seasonalCycle.destroy();

      // Aggregate national monthly normal across 115 years
      const natMonthly = mLabels.map(m => {
        const vals = data.national_trend.map(d => d.months[m]).filter(v => v !== null);
        return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
      });

      chartInstances.seasonalCycle = new Chart(ctxMonthlyCycle, {
        type: 'bar',
        data: {
          labels: mLabels,
          datasets: [{
            label: 'All-India Monthly Mean Rainfall (mm)',
            data: natMonthly,
            backgroundColor: natMonthly.map((v, i) => (i >= 5 && i <= 8) ? colors.monsoon : colors.primary),
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.raw} mm`
              }
            }
          },
          scales: {
            x: { grid: { color: colors.gridColor }, ticks: { color: colors.textColor } },
            y: { grid: { color: colors.gridColor }, ticks: { color: colors.textColor }, title: { display: true, text: 'Rainfall (mm)', color: colors.textColor } }
          }
        }
      });
    }

    // 2. National Seasonal Contribution Donut
    const ctxSeasonShare = document.getElementById('seasonalDonutChart');
    if (ctxSeasonShare) {
      if (chartInstances.seasonDonut) chartInstances.seasonDonut.destroy();

      const natJF = data.national_trend.reduce((a, b) => a + b.jan_feb, 0) / data.national_trend.length;
      const natMAM = data.national_trend.reduce((a, b) => a + b.mar_may, 0) / data.national_trend.length;
      const natJJAS = data.national_trend.reduce((a, b) => a + b.monsoon, 0) / data.national_trend.length;
      const natOND = data.national_trend.reduce((a, b) => a + b.oct_dec, 0) / data.national_trend.length;

      chartInstances.seasonDonut = new Chart(ctxSeasonShare, {
        type: 'doughnut',
        data: {
          labels: ['Winter (Jan-Feb)', 'Pre-Monsoon (Mar-May)', 'Monsoon (Jun-Sep)', 'Post-Monsoon (Oct-Dec)'],
          datasets: [{
            data: [natJF, natMAM, natJJAS, natOND],
            backgroundColor: ['#38bdf8', '#facc15', '#06b6d4', '#a855f7'],
            borderWidth: 2,
            borderColor: 'rgba(17, 24, 39, 0.85)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: colors.textColor } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const val = ctx.raw;
                  const total = natJF + natMAM + natJJAS + natOND;
                  const pct = ((val / total) * 100).toFixed(1);
                  return `${ctx.label}: ${val.toFixed(1)} mm (${pct}%)`;
                }
              }
            }
          }
        }
      });
    }

    // 3. Contrast Regimes (Southwest vs Northeast vs Western Disturbances)
    const ctxContrast = document.getElementById('seasonalRegimeChart');
    if (ctxContrast) {
      if (chartInstances.seasonContrast) chartInstances.seasonContrast.destroy();

      // Pick representative subdivisions
      const swSub = data.subdivisions_data['KONKAN & GOA'];
      const neSub = data.subdivisions_data['TAMIL NADU'];
      const wdSub = data.subdivisions_data['JAMMU & KASHMIR'];

      const sKeys = ['Jan-Feb', 'Mar-May', 'Jun-Sep', 'Oct-Dec'];
      const sLabels = ['Winter (Jan-Feb)', 'Pre-Monsoon (Mar-May)', 'Monsoon (Jun-Sep)', 'Post-Monsoon (Oct-Dec)'];

      chartInstances.seasonContrast = new Chart(ctxContrast, {
        type: 'bar',
        data: {
          labels: sLabels,
          datasets: [
            {
              label: 'Konkan & Goa (SW Monsoon Dominant)',
              data: sKeys.map(k => swSub.metadata.season_normals[k]),
              backgroundColor: colors.monsoon,
              borderRadius: 3
            },
            {
              label: 'Tamil Nadu (Post-Monsoon Dominant)',
              data: sKeys.map(k => neSub.metadata.season_normals[k]),
              backgroundColor: colors.purple,
              borderRadius: 3
            },
            {
              label: 'Jammu & Kashmir (Winter WD Influence)',
              data: sKeys.map(k => wdSub.metadata.season_normals[k]),
              backgroundColor: '#38bdf8',
              borderRadius: 3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: colors.textColor, font: { size: 10 } } }
          },
          scales: {
            x: { grid: { color: colors.gridColor }, ticks: { color: colors.textColor } },
            y: { grid: { color: colors.gridColor }, ticks: { color: colors.textColor }, title: { display: true, text: 'Seasonal Rainfall (mm)', color: colors.textColor } }
          }
        }
      });
    }
  }

  // ----------------------------------------------------
  // 7. Section 5: Climate Extremes & Risk Assessment
  // ----------------------------------------------------
  function renderExtremesView() {
    // 1. Highest & Lowest Records Table
    const wetTbody = document.getElementById('extremeWetTbody');
    const dryTbody = document.getElementById('extremeDryTbody');

    if (wetTbody) {
      wetTbody.innerHTML = '';
      data.rankings.top_10_extreme_wet_years.forEach((r, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>#${idx + 1}</strong></td>
          <td><strong>${r.subdivision}</strong></td>
          <td><span class="badge-status badge-excess">${r.year}</span></td>
          <td><strong style="color:#10b981">${r.annual.toLocaleString()} mm</strong></td>
          <td>${r.monsoon ? r.monsoon.toLocaleString() + ' mm' : 'N/A'}</td>
        `;
        wetTbody.appendChild(tr);
      });
    }

    if (dryTbody) {
      dryTbody.innerHTML = '';
      data.rankings.top_10_extreme_dry_years.forEach((r, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>#${idx + 1}</strong></td>
          <td><strong>${r.subdivision}</strong></td>
          <td><span class="badge-status badge-scanty">${r.year}</span></td>
          <td><strong style="color:#ef4444">${r.annual.toLocaleString()} mm</strong></td>
          <td>${r.monsoon ? r.monsoon.toLocaleString() + ' mm' : 'N/A'}</td>
        `;
        dryTbody.appendChild(tr);
      });
    }

    // 2. Coefficient of Variation (CV %) Volatility Chart
    const ctxCV = document.getElementById('extremesCVChart');
    if (ctxCV) {
      if (chartInstances.extremesCV) chartInstances.extremesCV.destroy();

      const sortedCV = [...data.subdivision_stats].sort((a, b) => b.cv_pct - a.cv_pct);
      const cvLabels = sortedCV.map(d => d.name);
      const cvVals = sortedCV.map(d => d.cv_pct);
      const cvColors = cvVals.map(v => v >= 30 ? colors.scanty : (v >= 20 ? colors.deficient : colors.excess));

      chartInstances.extremesCV = new Chart(ctxCV, {
        type: 'bar',
        data: {
          labels: cvLabels,
          datasets: [{
            label: 'Coefficient of Variation (CV %)',
            data: cvVals,
            backgroundColor: cvColors,
            borderRadius: 3
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => `CV: ${ctx.raw}% (Mean Annual: ${sortedCV[ctx.dataIndex].mean_annual} mm)`
              }
            }
          },
          scales: {
            x: { grid: { color: colors.gridColor }, ticks: { color: colors.textColor, callback: (v) => `${v}%` }, title: { display: true, text: 'CV (%)', color: colors.textColor } },
            y: { grid: { display: false }, ticks: { color: colors.textColor, font: { size: 9 } } }
          }
        }
      });
    }

    // 3. Drought / Deficient Frequency by Subdivision
    const ctxDroughtFreq = document.getElementById('extremesDroughtChart');
    if (ctxDroughtFreq) {
      if (chartInstances.extremesDrought) chartInstances.extremesDrought.destroy();

      const sortedDrought = [...data.subdivision_stats].sort((a, b) => b.drought_deficient_years - a.drought_deficient_years);
      const dLabels = sortedDrought.map(d => d.name);
      const defVals = sortedDrought.map(d => d.deficient_years);
      const scaVals = sortedDrought.map(d => d.scanty_years);

      chartInstances.extremesDrought = new Chart(ctxDroughtFreq, {
        type: 'bar',
        data: {
          labels: dLabels,
          datasets: [
            {
              label: 'Deficient Years (-20% to -59%)',
              data: defVals,
              backgroundColor: colors.deficient,
              borderRadius: 2
            },
            {
              label: 'Scanty / Extreme Drought (<= -60%)',
              data: scaVals,
              backgroundColor: colors.scanty,
              borderRadius: 2
            }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { stacked: true, grid: { color: colors.gridColor }, ticks: { color: colors.textColor }, title: { display: true, text: 'Number of Years (1901–2015)', color: colors.textColor } },
            y: { stacked: true, grid: { display: false }, ticks: { color: colors.textColor, font: { size: 9 } } }
          },
          plugins: {
            legend: { labels: { color: colors.textColor, font: { size: 10 } } }
          }
        }
      });
    }
  }

  // ----------------------------------------------------
  // 8. CSV Export Helper
  // ----------------------------------------------------
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Type,Entity,Year_or_Scope,Annual_Rainfall_mm,Monsoon_Jun_Sep_mm,Anomaly_Pct\n";

      // Export National Trend
      data.national_trend.forEach(d => {
        csvContent += `National,All_India,${d.year},${d.annual},${d.monsoon},${d.annual_anomaly_pct}\n`;
      });

      // Export Subdivision Normals
      data.subdivision_stats.forEach(s => {
        csvContent += `Subdivision_Normal,${s.name.replace(/,/g, '')},1901-2015,${s.mean_annual},${s.monsoon_mean},0\n`;
      });

      // Export District Normals
      data.districts_list.forEach(d => {
        csvContent += `District_Normal,${d.district.replace(/,/g, '')} (${d.state.replace(/,/g, '')}),Normal,${d.annual},${d.monsoon},0\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "India_Rainfall_Dashboard_Export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  // ----------------------------------------------------
  // 9. Initial Render Call
  // ----------------------------------------------------
  initKPIs();
  renderExecutiveOverview();
  renderSubdivisionView();
  initStateDistrictDropdowns();
  renderDistrictView();
  renderSeasonalView();
  renderExtremesView();
});
