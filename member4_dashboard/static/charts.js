// ─────────────────────────────────────────
// LOAD SAVINGS CARDS
// ─────────────────────────────────────────

fetch("/api/savings")
  .then(res => res.json())
  .then(data => {
    document.getElementById("savings-amount").textContent =
      "₹" + data.estimated_savings_rupees;
    document.getElementById("total-kwh").textContent =
      data.total_monthly_kwh + " kWh";
    document.getElementById("solar-days").textContent =
      data.high_solar_days + " days";
    document.getElementById("new-bill").textContent =
      "₹" + data.new_estimated_bill;
  });

// ─────────────────────────────────────────
// SOLAR PREDICTION CHART
// ─────────────────────────────────────────

fetch("/api/solar")
  .then(res => res.json())
  .then(data => {
    const labels = data.map(d => d.date);
    const values = data.map(d => d.predicted_solar);

    new Chart(document.getElementById("solarChart"), {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "Solar Energy (kWh/m²)",
          data: values,
          borderColor: "#F5A623",
          backgroundColor: "rgba(245,166,35,0.15)",
          borderWidth: 2.5,
          pointRadius: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        plugins: { legend: { labels: { color: "#ffffff" } } },
        scales: {
          x: { ticks: { color: "#8FA3B1", maxTicksLimit: 8 },
               grid: { color: "#1A3A5C" } },
          y: { ticks: { color: "#8FA3B1" },
               grid: { color: "#1A3A5C" } }
        }
      }
    });
  });

// ─────────────────────────────────────────
// DEVICE USAGE CHART
// ─────────────────────────────────────────

fetch("/api/devices")
  .then(res => res.json())
  .then(data => {
    const labels = data.map(d => d.device);
    const values = data.map(d => d.monthly_kwh);
    const colors = [
      "#E74C3C","#E67E22","#F5A623",
      "#27AE60","#0EB8A4","#3498DB","#9B59B6"
    ];

    new Chart(document.getElementById("deviceChart"), {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "kWh / month",
          data: values,
          backgroundColor: colors,
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: "#8FA3B1" },
               grid: { color: "#1A3A5C" } },
          y: { ticks: { color: "#ffffff" },
               grid: { color: "#1A3A5C" } }
        }
      }
    });
  });

// ─────────────────────────────────────────
// SCHEDULE TABLE
// ─────────────────────────────────────────

fetch("/api/schedule")
  .then(res => res.json())
  .then(data => {
    const tbody = document.getElementById("schedule-body");
    tbody.innerHTML = "";

    data.forEach(day => {
      const top = day.recommended_devices[0];
      const priority = top ? top.priority : "-";
      const device   = top ? top.device   : "-";
      const times    = top ? top.use_during.join(", ") : "-";

      tbody.innerHTML += `
        <tr>
          <td>${day.date}</td>
          <td>${day.solar_level} kWh/m²</td>
          <td>${day.peak_hours.join(", ")}</td>
          <td>${device}</td>
          <td>${times}</td>
          <td class="priority-${priority}">${priority}</td>
        </tr>`;
    });
  });

// ─────────────────────────────────────────
// BILL TRACKER
// ─────────────────────────────────────────

let billChart = null;

function addBill() {
  const month  = document.getElementById("bill-month").value;
  const amount = document.getElementById("bill-amount").value;

  if (!month || !amount) {
    alert("Please enter both month and amount!");
    return;
  }

  fetch("/api/add_bill", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ month, amount: parseFloat(amount) })
  })
  .then(res => res.json())
  .then(data => {
    updateBillChart(data.bills);
    document.getElementById("bill-month").value  = "";
    document.getElementById("bill-amount").value = "";
  });
}

function updateBillChart(bills) {
  const labels  = bills.map(b => b.month);
  const amounts = bills.map(b => b.amount);
  const tip     = document.getElementById("bill-tip");

  // Show tip if bill went down
  if (amounts.length >= 2) {
    const last = amounts[amounts.length - 1];
    const prev = amounts[amounts.length - 2];
    tip.style.display = "block";
    if (last < prev) {
      tip.style.color = "#27AE60";
      tip.textContent =
        `✅ Great! Bill reduced by ₹${(prev - last).toFixed(0)}
         compared to last month. Keep using Solar Sync AI schedule!`;
    } else {
      tip.style.color = "#E74C3C";
      tip.textContent =
        `⚠️ Bill increased by ₹${(last - prev).toFixed(0)}.
         Try following the optimal schedule more strictly next month.`;
    }
  }

  if (billChart) billChart.destroy();

  billChart = new Chart(document.getElementById("billChart"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Monthly Bill (₹)",
        data: amounts,
        backgroundColor: amounts.map((a, i) =>
          i === 0 ? "#E74C3C" :
          a < amounts[i-1] ? "#27AE60" : "#E74C3C"
        ),
        borderRadius: 6
      }]
    },
    options: {
      plugins: { legend: { labels: { color: "#ffffff" } } },
      scales: {
        x: { ticks: { color: "#8FA3B1" },
             grid: { color: "#1A3A5C" } },
        y: { ticks: { color: "#8FA3B1" },
             grid: { color: "#1A3A5C" } }
      }
    }
  });
}
