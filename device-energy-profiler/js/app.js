let usageData = [];

function addDevice() {
  const name = document.getElementById('deviceSelect').value;
  const hours = parseFloat(document.getElementById('hours').value);
  const time = document.getElementById('time').value;

  const device = devices.find(d => d.name === name);

  if (!device || !hours) {
    alert("Fill all fields");
    return;
  }

  // Energy calculation
  const energy = (device.power / 1000) * hours;

  const entry = {
    name,
    hours,
    time,
    energy
  };

  usageData.push(entry);

  updateTable();
  updateSummary();
  detectPatterns();
  updateChart();
  updateMonthlyChart();
  updatePredictionChart();
  console.log("Calling recommendations...");
  showRecommendations(); 
}
function updateTable() {
  const table = document.getElementById('tableBody');
  table.innerHTML = "";

  usageData.forEach(d => {
    table.innerHTML += `
      <tr>
        <td class="p-2">${d.name}</td>
        <td class="p-2">${d.hours}</td>
        <td class="p-2">${d.energy.toFixed(2)}</td>
        <td class="p-2">${d.time}</td>
      </tr>
    `;
  });
}

function updateSummary() {
  let total = usageData.reduce((sum, d) => sum + d.energy, 0);

  // Update summary text
  let summaryText = `Total Consumption: ${total.toFixed(2)} kWh\n`;

  usageData.forEach(d => {
    let percent = (d.energy / total) * 100;
    summaryText += `${d.name}: ${percent.toFixed(1)}%\n`;
  });

  document.getElementById('summary').innerText = summaryText;

  // 🔥 UPDATE DASHBOARD CARDS HERE
  document.getElementById("totalEnergy").innerText = total.toFixed(2) + " kWh";
  document.getElementById("monthlyEnergy").innerText = `Monthly: ${getMonthlyEstimate()} kWh`;

  // Avoid error when no data
  if (usageData.length > 0) {
    document.getElementById("efficiency").innerText = calculateEfficiency() + "%";

    let peak = detectPeakHour();
    document.getElementById("peakHour").innerText = peak !== null ? peak + ":00" : "--";
  }
}
function detectPatterns() {
  let nightUsage = 0;
  let dayUsage = 0;

  usageData.forEach(d => {
    if (!d.time) return;

    let hour = parseInt(d.time.split(":")[0]);

    if (hour >= 18 || hour <= 6) {
      nightUsage += d.energy;
    } else {
      dayUsage += d.energy;
    }
  });

  let efficiency = ((dayUsage / (dayUsage + nightUsage)) * 100).toFixed(1);

  let insight = `🌱 Solar Efficiency: ${efficiency}%\n`;

  if (efficiency < 40) {
    insight += "⚠️ Low solar usage — shift appliances to daytime";
  } else if (efficiency < 70) {
    insight += " Moderate efficiency — can be improved";
  } else {
    insight += "✅ Excellent solar utilization!";
  }

  document.getElementById("insights").innerText = generateInsights();}
function detectPeakHour() {
  let hourMap = {};

  usageData.forEach(d => {
    if (!d.time) return;

    let hour = parseInt(d.time.split(":")[0]);

    if (!hourMap[hour]) hourMap[hour] = 0;

    hourMap[hour] += d.energy;
  });

  let peakHour = null;
  let maxEnergy = 0;

  for (let hour in hourMap) {
    if (hourMap[hour] > maxEnergy) {
      maxEnergy = hourMap[hour];
      peakHour = hour;
    }
  }

  return peakHour;
}
function getHighUsageDevice() {
  let max = 0;
  let deviceName = "";

  usageData.forEach(d => {
    if (d.energy > max) {
      max = d.energy;
      deviceName = d.name;
    }
  });

  return deviceName;
}
function detectSolarMismatch() {
  let mismatch = false;

  usageData.forEach(d => {
    if (!d.time) return;

    let hour = parseInt(d.time.split(":")[0]);

    if (hour < 10 || hour > 16) {
      mismatch = true;
    }
  });

  return mismatch;
}
function calculateEfficiency() {
  let dayUsage = 0;
  let total = 0;

  usageData.forEach(d => {
    total += d.energy;

    if (d.time) {
      let hour = parseInt(d.time.split(":")[0]);
      if (hour >= 10 && hour <= 16) {
        dayUsage += d.energy;
      }
    }
  });

  let score = (dayUsage / total) * 100;
  return score.toFixed(1);
}
function isShiftableDevice(name) {
  const flexibleDevices = [
    "Air Conditioner",
    "Washing Machine",
    "Television"
  ];

  return flexibleDevices.includes(name);
}
function calculateShiftablePercentage() {
  let total = 0;
  let shiftable = 0;

  usageData.forEach(d => {
    total += d.energy;

    if (!d.time) return;

    let hour = parseInt(d.time.split(":")[0]);

    if ((hour < 10 || hour > 16) && isShiftableDevice(d.name)) {
  shiftable += d.energy;
}
  });

  if (total === 0) return 0;

  let percentage = shiftable / total;

  // 🔥 Cap at 80% (realistic limit)
  return Math.min(percentage, 0.8);
}
function getBestTime(device) {
  if (device === "Air Conditioner") return "1 PM – 3 PM";
  if (device === "Washing Machine") return "11 AM – 1 PM";
  if (device === "Refrigerator") return "12 PM – 2 PM";
  return "12 PM – 2 PM"; // default
}
function generateRecommendations() {
  let recommendations = [];

  usageData.forEach(d => {

    if (!d.time) return; // ✅ FIX ADDED

    let hour = parseInt(d.time.split(":")[0]);

    if (hour < 10 || hour > 16) {
      recommendations.push(
        `⚠️ ${d.name} used at ${hour}:00 — shift to ${getBestTime(d.name)} to use solar energy`
      );
    }

    if (d.energy > 2) {
      recommendations.push(
        `🔥 ${d.name} is a high consumption device (${d.energy.toFixed(1)} kWh)`
      );
    }

    if (d.name === "Air Conditioner" && hour >= 22) {
      recommendations.push(
        `❄️ AC used at night — consider pre-cooling during daytime`
      );
    }

    if (d.name === "Washing Machine" && hour < 10) {
      recommendations.push(
        `🧺 Run Washing Machine after 10 AM for better solar utilization`
      );
    }
  });

  return recommendations;
}
function showRecommendations() {
  const recs = generateRecommendations();
  const savings = estimateSavings();

  let text = "";

  if (recs.length === 0) {
    text = "✅ Your usage is already optimized!";
  } else {
    recs.forEach(r => {
      text += r + "\n";
    });
  }

  text += `\n Estimated Cost: ₹${savings.cost}`;
 // text += `\n💸 Potential Savings: ₹${savings.savings}`;
  text += `\n You can save ${savings.percent}% on your electricity bill`;

  document.getElementById("recommendations").innerText = text;
}
function estimateSavings() {
  let total = usageData.reduce((sum, d) => sum + d.energy, 0);

  let cost = total * 8;

  let shiftPercentage = calculateShiftablePercentage();

  let savings = cost * shiftPercentage;

  return {
    cost: cost.toFixed(2),
    savings: savings.toFixed(2),
    percent: (shiftPercentage * 100).toFixed(1)
  };
}
function runSimulation() {
  if (usageData.length === 0) {
    document.getElementById("simulationResult").innerText =
      "⚠️ Add some device data first";
    return;
  }

  let totalEnergy = usageData.reduce((sum, d) => sum + d.energy, 0);

  let currentCost = totalEnergy * 8;

  let base = calculateShiftablePercentage();

// Add variation ±10%
let variation = (Math.random() * 0.2) - 0.1;

let shiftPercentage = base + variation;

// Clamp between 10% and 80%
shiftPercentage = Math.max(0.1, Math.min(shiftPercentage, 0.8));

  let optimizedEnergy = totalEnergy * shiftPercentage;

  let optimizedCost = (totalEnergy - optimizedEnergy) * 8;

  let savings = currentCost - optimizedCost;

  let percent = (shiftPercentage * 100).toFixed(1);

  document.getElementById("simulationResult").innerText =
    ` If you shift ${(shiftPercentage * 100).toFixed(0)}% usage to daytime:\n` +  // ✅ UPDATED LINE
    ` Current Cost: ₹${currentCost.toFixed(2)}\n` +
    ` Optimized Cost: ₹${optimizedCost.toFixed(2)}\n` +
    ` You Save: ₹${savings.toFixed(2)}\n` +
    ` You can save ${percent}% on your bill`;
}
function getMonthlyEstimate() {
  let total = usageData.reduce((sum, d) => sum + d.energy, 0);
  return (total * 30).toFixed(2);
}
function generateInsights() {
  if (usageData.length === 0) {
    return "Add data to see insights";
  }

  let nightUsage = 0;
  let dayUsage = 0;

  usageData.forEach(d => {
    if (!d.time) return;

    let hour = parseInt(d.time.split(":")[0]);

    if (hour >= 10 && hour <= 16) {
      dayUsage += d.energy;
    } else {
      nightUsage += d.energy;
    }
  });

  let total = nightUsage + dayUsage;

  if (total === 0) return "No usage data";

  let nightPercent = ((nightUsage / total) * 100).toFixed(0);

  if (nightPercent > 60) {
    return "⚠️ Most energy is used at night — high optimization potential!";
  } else {
    return "✅ Good usage pattern — balanced energy consumption";
  }
}