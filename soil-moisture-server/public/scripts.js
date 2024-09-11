document.addEventListener('DOMContentLoaded', function() {
  const homeLink = document.getElementById('home-link');
  const monitorLink = document.getElementById('monitor-link');
  const settingsLink = document.getElementById('settings-link');
  const weeklyReportLink = document.getElementById('weekly-report-link');
  const stageSelect = document.getElementById('stage-select');
  const waterContentInput = document.getElementById('water-content');
  const moistureThresholdInput = document.getElementById('moisture-threshold');
  const saveSettingsButton = document.getElementById('save-settings');
  const reportsList = document.getElementById('reports-list');
  const formData = document.getElementById('edit-report-form');
  const reportUploadForm = document.getElementById('report-upload-form');

  let sensorUpdateInterval;
  let logUpdateInterval;

  // Shared state to keep track of relay status
  let relayStatus = 'unknown';

  // Initial setup
  showPage('home');
  startRealTimeUpdates();
  fetchWeatherData();
  fetchTodayLog(); // Fetch the log initially

  // Navigation
  homeLink.addEventListener('click', function() {
    showPage('home');
  });

  monitorLink.addEventListener('click', function() {
    showPage('monitor');
    startSensorUpdates(); // Start fetching sensor data when Monitor page is visible
    startLogUpdates(); // Start fetching today's log data when Monitor page is visible
  });

  settingsLink.addEventListener('click', function() {
    showPage('settings');
  });

  weeklyReportLink.addEventListener('click', function() {
    showPage('weekly-report');
  });

  // Functions to manage page visibility and updates
  function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
      page.style.display = page.id === pageId ? 'block' : 'none';
    });

    if (pageId !== 'monitor') {
      stopSensorUpdates();
      stopLogUpdates();
    }
  }

  function startRealTimeUpdates() {
    fetchHomePageData(); // Fetch data initially
    setInterval(fetchHomePageData, 5000); // Fetch data every 5 seconds
  }

  function startSensorUpdates() {
    fetchSensorData(); // Fetch data initially
    sensorUpdateInterval = setInterval(fetchSensorData, 5000); // Fetch data every 5 seconds
  }

  function stopSensorUpdates() {
    clearInterval(sensorUpdateInterval); // Stop the interval
  }

  function startLogUpdates() {
    fetchTodayLog(); // Fetch data initially
    logUpdateInterval = setInterval(fetchTodayLog, 5000); // Fetch data every 5 seconds
  }

  function stopLogUpdates() {
    clearInterval(logUpdateInterval); // Stop the interval
  }

  // Fetch data from server
  function fetchHomePageData() {
    fetch('/data')
      .then(response => response.json())
      .then(data => {
        relayStatus = data.relayStatus; // Update the shared state
        updateHomePage(data);
      })
      .catch(error => console.error('Error fetching home page data:', error));
  }

  function fetchSensorData() {
    fetch('/data')
      .then(response => response.json())
      .then(data => {
        relayStatus = data.relayStatus; // Update the shared state
        updateSensorStatus(data);
        fetchTodayLog(); // Fetch today's log to ensure it updates with the latest data
      })
      .catch(error => console.error('Error fetching sensor data:', error));
  }

  function updateHomePage(data) {
    document.getElementById('average-moisture').innerText = `${data.averageMoisture}%`;
    document.getElementById('relay-status').innerText = `Relay Status: ${relayStatus}`;
  }

  function updateSensorStatus(data) {
    const sensorStatusDiv = document.getElementById('sensor-status');
    sensorStatusDiv.innerHTML = ''; // Clear previous data

    for (let i = 1; i <= 9; i++) {
      const sensorValue = data[`sensor${i}`];
      const sensorItem = document.createElement('div');
      sensorItem.className = 'sensor-item';
      sensorItem.innerHTML = `<strong>Sensor ${i}</strong>: ${sensorValue}%`;
      sensorStatusDiv.appendChild(sensorItem);
    }
  }

  function fetchWeatherData() {
    const latitude = 15.6199; // Replace with your desired latitude
    const longitude = 120.377; // Replace with your desired longitude

    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`)
      .then(response => response.json())
      .then(data => {
        updateWeather(data);
      })
      .catch(error => console.error('Error fetching weather data:', error));
  }

  function updateWeather(data) {
    const weatherElement = document.getElementById('weather');
    const temperature = data.current_weather.temperature;
    const weatherDescription = data.current_weather.weathercode;

    weatherElement.innerText = `Current Temperature: ${temperature}°C, Weather: ${getWeatherDescription(weatherDescription)}`;
  }

  function getWeatherDescription(weathercode) {
    const weatherCodes = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };

    return weatherCodes[weathercode] || 'Unknown';
  }

  function fetchTodayLog() {
    fetch('/today-log')
      .then(response => response.json())
      .then(logs => {
        console.log('Fetched logs:', logs); // Debugging line
        const logContainer = document.getElementById('today-log');
        logContainer.innerHTML = ''; // Clear previous logs
  
        logs.forEach(log => {
          const logItem = document.createElement('li');
          const relayStatusLog = log.relayStatus === "on" ? "Relay Off" : "Relay On";
          const sensorTriggered = log.lastSensorTriggered ? `, Last Sensor Triggered: Sensor ${log.lastSensorTriggered}` : "";
          const stopTime = log.stopTime ? `, Relay Stopped At: ${log.stopTime}` : "";
          logItem.innerText = `Time: ${log.time}, Average Moisture: ${log.moisture}%, Relay Status: ${relayStatusLog}${sensorTriggered}${stopTime}`;
          logContainer.appendChild(logItem);
        });
  
        // Ensure the Home page is updated with the latest relay status from logs
        if (logs.length > 0) {
          const latestLog = logs[logs.length - 1];
          relayStatus = latestLog.relayStatus; // Update the shared state
          updateHomePage({ averageMoisture: latestLog.moisture, relayStatus: relayStatus });
        }
      })
      .catch(error => console.error('Error fetching today\'s log:', error));
  }
  
  
  
  

  weeklyReportLink.addEventListener('click', function() {
    showPage('weekly-report');
    fetchWeeklyReports(); // Fetch and display reports when the Weekly Report page is visible
  });

  function fetchWeeklyReports() {
    fetch('/weekly-reports')
      .then(response => response.json())
      .then(reports => {
        reportsList.innerHTML = ''; // Clear previous reports
  
        reports.forEach(report => {
          const reportItem = document.createElement('li');
          const imageUrl = report.image ? `/images/${report.image}` : '';
          reportItem.innerHTML = `
            <h4>${report.title}</h4>
            <p>Date: ${report.report_date}</p>
            <p>Description: ${report.description}</p>
            ${imageUrl ? `<img src="${imageUrl}" alt="${report.title}" style="max-width: 300px;">` : ''}
            <button class="edit-report-button" data-id="${report.id}">Edit</button>
            <button class="delete-report-button" data-id="${report.id}">Delete</button>
          `;
          reportsList.appendChild(reportItem);
        });
  
        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-report-button').forEach(button => {
          button.addEventListener('click', function() {
            const reportId = this.getAttribute('data-id');
            console.log('Editing report with ID:', reportId);
        
            fetch(`/report/${reportId}`)
              .then(response => {
                if (!response.ok) {
                  throw new Error(`Report not found: ${response.status}`);
                }
                return response.json();
              })
              .then(report => {
                // Populate the edit form with existing report data
                document.getElementById('edit-report-id').value = report.id;
                document.getElementById('edit-report-title').value = report.title;
                document.getElementById('edit-report-date').value = report.report_date;
                document.getElementById('edit-report-description').value = report.description;
                // No need to change image, upload new one if needed
                showPage('edit-report-form');
              })
              .catch(error => console.error('Error fetching report details:', error));
          });
        });
      
      // Handling the form submission
      document.getElementById('edit-report').addEventListener('submit', function(event) {
          event.preventDefault(); // Prevent the default form submission
      
          const reportId = document.getElementById('edit-report-id').value;
          const formData = new FormData(this);
      
          fetch(`/update-report/${reportId}`, {
              method: 'PUT',
              body: formData
          })
          .then(response => {
              if (!response.ok) {
                  throw new Error('Failed to update report');
              }
              return response.json();
          })
          .then(data => {
              console.log('Report updated successfully:', data);
              // Handle successful update, e.g., redirect or show success message
          })
          .catch(error => console.error('Error updating report:', error));
          fetchWeeklyReports();
          showPage('weekly-report');
      });
        
        document.querySelectorAll('.delete-report-button').forEach(button => {
          button.addEventListener('click', function() {
            const reportId = this.getAttribute('data-id');
            fetch(`/delete-report/${reportId}`, { method: 'DELETE' })
              .then(() => {
                fetchWeeklyReports(); // Refresh the list after deletion
              })
              .catch(error => console.error('Error deleting report:', error));
          });
        });
      })
      .catch(error => console.error('Error fetching weekly reports:', error));
  }

// Handle delete report button
document.getElementById('delete-report-button').addEventListener('click', function() {
  const reportId = document.getElementById('edit-report-id').value;

  fetch(`/delete-report/${reportId}`, { method: 'DELETE' })
    .then(() => {
      fetchWeeklyReports(); // Refresh the report list
      showPage('weekly-report'); // Return to the report list page
    })
    .catch(error => console.error('Error deleting report:', error));
});
document.getElementById('report-upload-form').addEventListener('submit', function(event) {
  event.preventDefault(); // Prevent the default form submission

  const formData = new FormData(this);

  fetch('/upload-report', {
    method: 'POST',
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to generate report');
    }
    return response.json();
  })
  .then(data => {
    console.log('Report generated successfully:', data);
    // Alert the user that the report was generated successfully
    alert('Report generated successfully!');
    // Redirect to the Weekly Report page
    showPage('weekly-report');
    fetchWeeklyReports(); // Refresh the report list
    // Refresh the page
    window.location.reload();
  })
  .catch(error => console.error('Error generating report:', error));
});





const phaseInfo = {
  vegetative: {
    description: "In this phase, the onion plant focuses on leaf development and establishing a strong root system. Proper moisture and nutrients are critical for healthy growth.",
    duration: 45 // days
  },
  bulbing: {
    description: "During the bulbing phase, the plant starts forming the bulb, which is the edible part of the onion. Adequate moisture and correct daylight hours are essential.",
    duration: 30 // days
  },
  flowering: {
    description: "In the flowering phase, the onion plant produces a flower stalk. This phase is usually avoided for bulb production but important for seed harvesting.",
    duration: 15 // days
  }
};

// DOM Elements for Phase Reminder and Log
const currentPhaseElement = document.getElementById('current-phase');
const nextPhaseChangeElement = document.getElementById('next-phase-change');
const phaseDescriptionElement = document.getElementById('description-text');
const phaseDurationElement = document.getElementById('phase-duration');
const phaseSelectElement = document.getElementById('phase');
const savePhaseButton = document.getElementById('save-phase');
const phaseLogList = document.getElementById('phase-log');

// Initialize Phase Information
fetchCurrentPhase();

// Update Phase Description on Selection Change
phaseSelectElement.addEventListener('change', function() {
  const selectedPhase = phaseSelectElement.value;
  updatePhaseDescription(selectedPhase);
});

// Save Phase Selection
savePhaseButton.addEventListener('click', function() {
  const selectedPhase = phaseSelectElement.value;
  const startDate = new Date().toISOString();

  fetch('/set-phase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phase: selectedPhase, startDate: startDate })
  })
  .then(response => response.json())
  .then(data => {
    alert(`Phase set to: ${data.phase}`);
    updatePhaseReminder(data.phase, data.startDate);
    fetchPhaseLogs();
  })
  .catch(error => console.error('Error setting phase:', error));
});

// Fetch Current Phase from Server
function fetchCurrentPhase() {
  fetch('/current-phase')
    .then(response => response.json())
    .then(data => {
      updatePhaseReminder(data.phase, data.startDate);
    })
    .catch(error => console.error('Error fetching current phase:', error));
}

// Update Phase Description
function updatePhaseDescription(phase) {
  phaseDescriptionElement.innerText = phaseInfo[phase].description;
  phaseDurationElement.innerText = phaseInfo[phase].duration;
}

// Update Phase Reminder
function updatePhaseReminder(phase, startDate) {
  currentPhaseElement.innerText = capitalizeFirstLetter(phase);
  const start = new Date(startDate);
  const now = new Date();
  const elapsedDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(phaseInfo[phase].duration - elapsedDays, 0);
  nextPhaseChangeElement.innerText = remainingDays;
  phaseSelectElement.value = phase;
  updatePhaseDescription(phase);
}

// Fetch Phase Logs
function fetchPhaseLogs() {
  fetch('/phase-logs')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(logs => {
      console.log('Fetched logs:', logs); // Debugging line
      phaseLogList.innerHTML = '';
      logs.forEach(log => {
        console.log('Received startDate:', log.start_date); // Debugging line
        const logItem = document.createElement('li');
        logItem.innerHTML = `
          <strong>Phase:</strong> ${capitalizeFirstLetter(log.phase)} |
          <strong>Start Date:</strong> ${formatDate(log.start_date)}
        `;
        phaseLogList.appendChild(logItem);
      });
    })
    .catch(error => {
      console.error('Error fetching phase logs:', error);
    });
}




// Utility Functions
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Invalid Date'; // Handle invalid date
  }
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return date.toLocaleDateString(undefined, options);
}



// Initial Fetches
fetchPhaseLogs();

});

function updateWaterUsage() {
  fetch('/water-usage-today')
    .then(response => response.json())
    .then(data => {
      document.getElementById('water-usage').textContent = `${data.waterUsage} L`; // Adjust based on your server response
    })
    .catch(error => console.error('Error fetching water usage:', error));
}

// Call this function periodically or on page load
updateWaterUsage();

