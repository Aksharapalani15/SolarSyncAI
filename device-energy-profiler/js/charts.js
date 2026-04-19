let barChart;
let pieChart;

function updateChart() {
  const labels = usageData.map(d => d.name);
  const energyData = usageData.map(d => d.energy);

  const total = energyData.reduce((a, b) => a + b, 0);
  const percentageData = energyData.map(e => ((e / total) * 100).toFixed(1));

  // Destroy old charts
  if (barChart) barChart.destroy();
  if (pieChart) pieChart.destroy();

  // BAR CHART
  barChart = new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Energy (kWh)",
        data: energyData
      }]
    }
  });

  // PIE CHART
  pieChart = new Chart(document.getElementById("pieChart"), {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{
        data: percentageData
      }]
    }
  });
}
function generateMonthlyData() {
  let base = usageData.reduce((sum, d) => sum + d.energy, 0);

  let data = [];

  usageData.forEach(d => {
    base += d.energy;
  });

  for (let i = 1; i <= 30; i++) {
    let weekdayFactor = (i % 7 === 0) ? 0.9 : 1; // less on Sundays
    let variation = base * (0.85 + Math.random() * 0.3);

    data.push((variation * weekdayFactor).toFixed(2));
  }

  return data;
}
let monthlyChart;

function updateMonthlyChart() {
  const ctx = document.getElementById("monthlyChart").getContext("2d");

  let labels = Array.from({ length: 30 }, (_, i) => "Day " + (i + 1));
  let data = generateMonthlyData();

  if (monthlyChart) {
    monthlyChart.destroy();
  }

  monthlyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Energy (kWh)",
        data: data,
        fill: true,
        tension: 0.3
      }]
    }
  });
}

let predictionChart;

function generatePredictionData() {
  if (usageData.length === 0) return [0,0,0,0,0,0,0]; // safety

  let history = generateMonthlyData().map(Number);

  let prediction = [];

  for (let i = 0; i < 7; i++) {
    let last5 = history.slice(-5);

    let avg = last5.reduce((sum, val) => sum + val, 0) / last5.length;

    let next = avg * (0.95 + Math.random() * 0.1);

    prediction.push(Number(next.toFixed(2)));

    history.push(next);
  }

  return prediction;
}
function updatePredictionChart() {
  const ctx = document.getElementById("predictionChart").getContext("2d");

  let labels = [
    "Day 1", "Day 2", "Day 3",
    "Day 4", "Day 5", "Day 6", "Day 7"
  ];

  let data = generatePredictionData();

  if (predictionChart) {
    predictionChart.destroy();
  }

 predictionChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: labels,
    datasets: [{
      label: "Predicted Energy (kWh)",
      data: data,
      borderColor: "blue",          // ✅ ADD THIS
      backgroundColor: "lightblue", // ✅ ADD THIS
      borderDash: [5, 5],
      tension: 0.3
    }]
  }
});
}