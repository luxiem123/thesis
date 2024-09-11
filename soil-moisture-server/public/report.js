document.addEventListener('DOMContentLoaded', function() {
    const homeLink = document.getElementById('home-link');
    const monitorLink = document.getElementById('monitor-link');
    const settingsLink = document.getElementById('settings-link');
    fetchReports();
    homeLink.addEventListener('click', function() {
        showPage('home');
      });
    
      monitorLink.addEventListener('click', function() {
        showPage('monitor');
        fetchSensorData();
      });
    
      settingsLink.addEventListener('click', function() {
        showPage('settings');
      });
      function showPage(pageId) {
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
          page.style.display = page.id === pageId ? 'block' : 'none';
        });
      }

    function fetchReports() {
      fetch('/get-reports.php')
        .then(response => response.json())
        .then(data => {
          displayReports(data);
        })
        .catch(error => console.error('Error fetching reports:', error));
    }

    function displayReports(reports) {
      const reportContentDiv = document.getElementById('report-content');
      reportContentDiv.innerHTML = ''; // Clear previous data

      reports.forEach(report => {
        const reportItem = document.createElement('div');
        reportItem.className = 'report-item';
        reportItem.innerHTML = `
          <strong>Timestamp:</strong> ${report.timestamp}<br>
          <strong>Average Moisture:</strong> ${report.average_moisture}%<br>
          <strong>Relay Status:</strong> ${report.relay_status}
        `;
        reportContentDiv.appendChild(reportItem);
      });
    }
});

