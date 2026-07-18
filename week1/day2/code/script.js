document.addEventListener('DOMContentLoaded', () => {
    // 1. Navigation Highlighting
    const navLinks = document.querySelectorAll('.nav-menu a, .sidebar-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            const href = this.getAttribute('href');
            navLinks.forEach(otherLink => {
                if (otherLink.getAttribute('href') === href) {
                    otherLink.classList.add('active');
                } else {
                    otherLink.classList.remove('active');
                }
            });
        });
    });

    // 2. Dynamic Telemetry Sync Triggers
    const btnSync = document.getElementById('btn-sync');
    const logList = document.getElementById('activity-logs');
    const accountsMetric = document.getElementById('metric-accounts');

    if (btnSync && logList) {
        btnSync.addEventListener('click', () => {
            btnSync.disabled = true;
            btnSync.textContent = '⌛ Syncing...';

            setTimeout(() => {
                // Randomly increment metric counts
                if (accountsMetric) {
                    let currentVal = parseInt(accountsMetric.textContent.replace(/,/g, ''), 10);
                    if (!isNaN(currentVal)) {
                        const increment = Math.floor(Math.random() * 8) + 1;
                        accountsMetric.textContent = (currentVal + increment).toLocaleString();
                    }
                }

                // Add timestamped log activity
                const now = new Date();
                const timeStr = now.toTimeString().substring(0, 5); // HH:MM
                
                const newLog = document.createElement('li');
                newLog.innerHTML = `<span class="log-time">${timeStr}</span> Telemetry sync complete. Data fields updated.`;
                
                newLog.style.opacity = '0';
                newLog.style.transform = 'translateX(-10px)';
                newLog.style.transition = 'all 0.3s ease';

                logList.insertBefore(newLog, logList.firstChild);

                setTimeout(() => {
                    newLog.style.opacity = '1';
                    newLog.style.transform = 'translateX(0)';
                }, 50);

                // Limit logs list length to 5
                if (logList.children.length > 5) {
                    logList.removeChild(logList.lastChild);
                }

                btnSync.textContent = '↻ Sync Data';
                btnSync.disabled = false;
            }, 600);
        });
    }
});