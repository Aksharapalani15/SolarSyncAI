let devices = [];

fetch('data/devices.json')
  .then(res => {
    if (!res.ok) {
      throw new Error("Failed to load JSON");
    }
    return res.json();
  })
  .then(data => {
    devices = data;

    const select = document.getElementById('deviceSelect');

    data.forEach(d => {
      let option = document.createElement('option');
      option.value = d.name;
      option.textContent = d.name;
      select.appendChild(option);
    });
  })
  .catch(err => {
    console.error("Error loading devices:", err);
  });