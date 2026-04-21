/* ══════════════════════════════════════════
   SOLAR SYNC AI — ADVANCED CHARTS & LOGIC
══════════════════════════════════════════ */

// ── STARFIELD ──
const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const stars = Array.from({ length: 160 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  r: Math.random() * 1.2,
  a: Math.random(),
  speed: 0.003 + Math.random() * 0.005
}));

function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach(s => {
    s.a += s.speed;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,220,240,${0.2 + 0.5 * Math.abs(Math.sin(s.a))})`;
    ctx.fill();
  });
  requestAnimationFrame(drawStars);
}
drawStars();
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// ── CLOCK ──
function tick() {
  const n = new Date();
  document.getElementById("clock").textContent =
    n.toLocaleTimeString("en-IN", { hour12: false });
  document.getElementById("dateline").textContent =
    n.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short", year:"numeric" });
}
setInterval(tick, 1000); tick();

// ── NAV ACTIVE ──
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    item.classList.add("active");
  });
});

// ── CHART GLOBAL DEFAULTS ──
const GRID  = "rgba(255,255,255,0.04)";
const LABEL = "#3D5A7A";
const TT = {
  backgroundColor: "#060E1C",
  borderColor: "rgba(255,255,255,0.08)",
  borderWidth: 1,
  titleColor: "#C8DCF0",
  bodyColor: "#3D5A7A",
  padding: 14, cornerRadius: 10,
  titleFont: { family: "IBM Plex Mono", size: 11 },
  bodyFont: { family: "IBM Plex Mono", size: 11 }
};
const AXIS = {
  x: { ticks: { color: LABEL, font: { family: "IBM Plex Mono", size: 10 } }, grid: { color: GRID } },
  y: { ticks: { color: LABEL, font: { family: "IBM Plex Mono", size: 10 } }, grid: { color: GRID } }
};

// ── SPARKLINE HELPER ──
function makeSparkline(id, data, color) {
  new Chart(document.getElementById(id), {
    type: "line",
    data: {
      labels: data.map((_,i) => i),
      datasets: [{ data, borderColor: color, borderWidth: 1.5,
        pointRadius: 0, fill: true, tension: 0.4,
        backgroundColor: color + "22" }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: { display: false },
        y: { display: false }
      },
      animation: { duration: 1500, easing: "easeInOutQuart" }
    }
  });
}

// ══ LOAD SAVINGS ══
fetch("/api/savings")
  .then(r => r.json())
  .then(d => {
    if (!d || !d.estimated_savings_rupees) return;

    document.getElementById("val-savings").textContent   = "₹" + d.estimated_savings_rupees;
    document.getElementById("val-kwh").textContent       = d.total_monthly_kwh + " kWh";
    document.getElementById("val-solar-days").textContent= d.high_solar_days + " / " + d.total_days;
    document.getElementById("val-new-bill").textContent  = "₹" + d.new_estimated_bill;

    // Solar index meter
    const idx = Math.min((d.high_solar_days / d.total_days) * 100, 100);
    document.getElementById("solar-index-bar").style.width = idx + "%";
    document.getElementById("solar-index-val").textContent = idx.toFixed(0) + "%";
    document.querySelector(".meter-glow").style.opacity = "1";

    // Banner
    const pct = Math.round((d.estimated_savings_rupees / d.original_monthly_bill) * 100);
    document.getElementById("banner-pct").textContent = pct + "%";
    document.getElementById("banner-summary").textContent =
      `Original bill ₹${d.original_monthly_bill} → New bill ₹${d.new_estimated_bill} · Saving ₹${d.estimated_savings_rupees}/month`;

    // Sparklines
    const sv = [d.original_monthly_bill * 0.2, d.original_monthly_bill * 0.3,
      d.estimated_savings_rupees * 0.6, d.estimated_savings_rupees * 0.8, d.estimated_savings_rupees];
    makeSparkline("spark1", sv, "#F5A623");
    makeSparkline("spark2", [d.total_monthly_kwh*0.9,d.total_monthly_kwh*0.95,d.total_monthly_kwh,
      d.total_monthly_kwh*0.97,d.total_monthly_kwh*0.93], "#00D4C8");
    makeSparkline("spark3", [d.high_solar_days*0.7,d.high_solar_days*0.8,d.high_solar_days*0.9,
      d.high_solar_days,d.high_solar_days], "#FFB300");
    makeSparkline("spark4", [d.original_monthly_bill,d.original_monthly_bill*0.9,
      d.original_monthly_bill*0.8,d.new_estimated_bill*1.1,d.new_estimated_bill], "#00E676");

    // Insights
    buildInsights(d);
  })
  .catch(() => {});

// ══ SOLAR FORECAST CHART ══
let solarData = [];
fetch("/api/solar")
  .then(r => r.json())
  .then(data => {
    if (!data.length) return;
    solarData = data;
    const labels = data.map(d => d.date.slice(5));
    const values = data.map(d => d.predicted_solar);
    const avg    = values.reduce((a,b)=>a+b,0)/values.length;

    const gradient = document.getElementById("solarChart")
      .getContext("2d").createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, "rgba(245,166,35,0.3)");
    gradient.addColorStop(1, "rgba(245,166,35,0)");

    new Chart(document.getElementById("solarChart"), {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Solar Energy (kWh/m²)",
            data: values,
            borderColor: "#F5A623",
            backgroundColor: gradient,
            borderWidth: 2.5,
            pointRadius: (ctx) => ctx.dataIndex % 5 === 0 ? 4 : 0,
            pointBackgroundColor: "#F5A623",
            pointBorderColor: "#060E1C",
            pointBorderWidth: 2,
            fill: true, tension: 0.4
          },
          {
            label: "Peak Threshold (5.0)",
            data: Array(values.length).fill(5.0),
            borderColor: "rgba(0,212,200,0.4)",
            borderWidth: 1.5, borderDash: [6,4],
            pointRadius: 0, fill: false
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: { ...TT }
        },
        scales: {
          x: { ...AXIS.x, ticks: { ...AXIS.x.ticks, maxTicksLimit: 12 } },
          y: { ...AXIS.y, min: 0 }
        },
        animation: { duration: 2000, easing: "easeInOutQuart" }
      }
    });

    // Gauge chart (donut)
    document.getElementById("gauge-val").textContent = avg.toFixed(1);
    const pct = (avg / 8) * 100;
    new Chart(document.getElementById("gaugeChart"), {
      type: "doughnut",
      data: {
        datasets: [{
          data: [pct, 100 - pct],
          backgroundColor: ["#F5A623", "#0A1628"],
          borderWidth: 0
        }]
      },
      options: {
        cutout: "75%", rotation: -90, circumference: 180,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        animation: { duration: 2000 }
      }
    });

    // Today's peak
    if (data[0]) {
      document.getElementById("today-peak").textContent =
        data[0].peak_hours.join(" · ") || "—";
    }

    // Timeline
    buildTimeline(data[0]);
  })
  .catch(() => {});

// ══ DEVICE CHART ══
fetch("/api/devices")
  .then(r => r.json())
  .then(data => {
    if (!data.length) return;
    const labels = data.map(d => d.name);
    const values = data.map(d => d.power);
    const COLORS = ["#FF4D4D","#FF8C42","#F5A623","#FFD580","#00E676","#00D4C8","#4DA6FF"];

    new Chart(document.getElementById("deviceChart"), {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Power (watts)",
          data: values,
          backgroundColor: COLORS.map(c => c + "CC"),
          borderColor: COLORS,
          borderWidth: 1.5,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { ...TT }
        },
        scales: {
          x: { ...AXIS.x },
          y: { ...AXIS.y }
        },
        animation: { duration: 1800, easing: "easeOutQuart" }
      }
    });

    // Device tags
    const tagsEl = document.getElementById("device-tags");
    data.forEach((d, i) => {
      const tag = document.createElement("div");
      tag.className = "device-tag";
      tag.innerHTML = `<span class="device-tag-dot" style="background:${COLORS[i % COLORS.length]}"></span>${d.name} · ${d.power}W`;
      tagsEl.appendChild(tag);
    });
  })
  .catch(() => {});

// ══ SCHEDULE TABLE ══
fetch("/api/schedule")
  .then(r => r.json())
  .then(data => {
    const tbody = document.getElementById("schedule-body");
    if (!data || !data.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-row">No schedule data found.</td></tr>`;
      return;
    }
    tbody.innerHTML = "";
    data.forEach(day => {
      const solarIcon = day.solar_level > 5 ? "⭐" : day.solar_level > 3 ? "🟡" : "☁️";
      const solarColor = day.solar_level > 5 ? "#F5A623" : day.solar_level > 3 ? "#FFB300" : "#3D5A7A";

      day.recommended_devices.forEach((dev, i) => {
        const tr = document.createElement("tr");
        let html = "";
        if (i === 0) {
          html += `<td rowspan="${day.recommended_devices.length}" style="color:var(--text2);font-family:'IBM Plex Mono',monospace;font-size:11px">${day.date}</td>`;
          html += `<td rowspan="${day.recommended_devices.length}"><span style="color:${solarColor}">${solarIcon} ${day.solar_level}</span></td>`;
          html += `<td rowspan="${day.recommended_devices.length}" style="font-size:11px;color:var(--text2)">${day.peak_hours.join(", ")}</td>`;
        }
        html += `<td style="font-weight:600">${dev.device}</td>`;
        html += `<td style="color:var(--teal);font-family:'IBM Plex Mono',monospace;font-size:11px">${dev.use_during.join(", ")}</td>`;
        html += `<td><span class="badge badge-${dev.priority}">${dev.priority}</span></td>`;
        html += `<td style="font-size:11px;color:var(--muted)">${dev.reason}</td>`;
        tr.innerHTML = html;
        tbody.appendChild(tr);
      });
    });
  })
  .catch(() => {});

// ══ BILL CHART ══
let billChart = null;

function addBill() {
  const month  = document.getElementById("bill-month").value.trim();
  const amount = parseFloat(document.getElementById("bill-amount").value);
  if (!month || !amount) { alert("Please enter both month and amount!"); return; }

  fetch("/api/add_bill", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ month, amount })
  })
  .then(r => r.json())
  .then(data => {
    document.getElementById("bill-month").value  = "";
    document.getElementById("bill-amount").value = "";
    renderBillChart(data.bills);
  });
}

function renderBillChart(bills) {
  const labels  = bills.map(b => b.month);
  const amounts = bills.map(b => b.amount);
  const tip = document.getElementById("bill-tip");

  if (amounts.length >= 2) {
    const last = amounts[amounts.length - 1];
    const prev = amounts[amounts.length - 2];
    const diff = Math.abs(last - prev).toFixed(0);
    tip.style.display = "block";
    if (last < prev) {
      tip.className = "bill-tip good";
      tip.innerHTML = `✅ Excellent! Bill reduced by ₹${diff} compared to last month. Solar Sync AI optimization is working! 🎉`;
    } else {
      tip.className = "bill-tip bad";
      tip.innerHTML = `⚠️ Bill increased by ₹${diff}. Follow the optimal schedule more strictly — run AC and heavy devices only during 10AM–2PM solar peak.`;
    }
  }

  const colors = amounts.map((a, i) => {
    if (i === 0) return "#4DA6FF";
    return a < amounts[i-1] ? "#00E676" : "#FF4D4D";
  });

  if (billChart) billChart.destroy();
  billChart = new Chart(document.getElementById("billChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Bill (₹)",
        data: amounts,
        backgroundColor: colors.map(c => c + "AA"),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { ...TT } },
      scales: { x: AXIS.x, y: AXIS.y },
      animation: { duration: 1000 }
    }
  });
}

// ══ PEAK HOUR TIMELINE ══
function buildTimeline(todayData) {
  const track = document.getElementById("timeline-track");
  const axis  = document.getElementById("timeline-axis");
  if (!track) return;

  const peakHours = todayData ? todayData.peak_hours.map(h => {
    const m = h.match(/(\d+)(AM|PM)/i);
    if (!m) return -1;
    let hr = parseInt(m[1]);
    if (m[2].toUpperCase() === "PM" && hr !== 12) hr += 12;
    if (m[2].toUpperCase() === "AM" && hr === 12) hr = 0;
    return hr;
  }).filter(h => h >= 0) : [];

  track.innerHTML = "";
  axis.innerHTML  = "";

  for (let h = 0; h < 24; h++) {
    const isPeak = peakHours.includes(h);
    const isGood = h >= 8 && h <= 17 && !isPeak;
    const ht = isPeak ? 64 : isGood ? 40 : 16;
    const cls = isPeak ? "t-block peak" : isGood ? "t-block good" : "t-block low";

    const block = document.createElement("div");
    block.className = cls;
    block.style.height = ht + "px";
    block.title = `${h}:00 — ${isPeak ? "⭐ PEAK SOLAR" : isGood ? "✅ Good Solar" : "☁️ Low Solar"}`;
    track.appendChild(block);

    const lbl = document.createElement("div");
    lbl.className = "t-label";
    lbl.textContent = h % 6 === 0 ? `${h}h` : "";
    axis.appendChild(lbl);
  }
}

// ══ AI INSIGHTS ══
function buildInsights(savings) {
  const pct = Math.round((savings.estimated_savings_rupees / savings.original_monthly_bill) * 100);
  const items = [
    {
      icon: "⚡",
      title: "Air Conditioner is your #1 cost driver",
      desc: "Running AC during 10AM–2PM solar peak eliminates grid dependency entirely.",
      val: "1500W"
    },
    {
      icon: "💰",
      title: `Save ₹${savings.estimated_savings_rupees} this month`,
      desc: "Achieved by shifting high-energy devices to solar peak hours.",
      val: `${pct}% off`
    },
    {
      icon: "☀️",
      title: `${savings.high_solar_days} high-intensity solar days detected`,
      desc: "Schedule washing machine and water heater on these days for max benefit.",
      val: `${savings.high_solar_days}d`
    },
    {
      icon: "🌙",
      title: "Avoid 6PM–10PM grid peak hours",
      desc: "Evening grid rates are 2–3× more expensive. Pre-cool rooms during solar peak instead.",
      val: "High cost"
    },
    {
      icon: "🌱",
      title: "Reduce CO₂ emissions by ~40%",
      desc: "Shifting device usage to solar hours eliminates fossil-fuel based electricity.",
      val: "Eco ✓"
    }
  ];

  const list = document.getElementById("insights-list");
  list.innerHTML = items.map((t, i) => `
    <div class="insight-item" style="animation-delay:${i * 0.1}s">
      <span class="insight-icon">${t.icon}</span>
      <div class="insight-body">
        <strong>${t.title}</strong>
        <span>${t.desc}</span>
      </div>
      <span class="insight-val">${t.val}</span>
    </div>
  `).join("");
}