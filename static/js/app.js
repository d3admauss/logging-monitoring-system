// Global variables
let autoSimulateInterval = null;
let isAutoSimulating = false;
let currentFilter = 'all';
let currentLimit = 15;
let currentSearch = '';
let searchTimeout = null;
let expandedLogIds = new Set();

// Helper function for log level styles
function getLevelStyles(level) {
    const styles = {
        'INFO': 'bg-blue-900/40 text-blue-300 border-blue-800',
        'WARNING': 'bg-yellow-900/40 text-yellow-300 border-yellow-800',
        'ERROR': 'bg-red-900/40 text-red-300 border-red-800',
        'DEBUG': 'bg-slate-700/40 text-slate-300 border-slate-600'
    };
    return styles[level] || styles['DEBUG'];
}

// Animate number changes
function animateNumberChange(elementId, newValue) {
    const element = document.getElementById(elementId);
    const oldValue = parseInt(element.innerText) || 0;
    if (newValue !== oldValue) {
        element.classList.add('number-pop');
        setTimeout(() => element.classList.remove('number-pop'), 300);
    }
    element.innerText = newValue;
}

// Set filter for logs
function setFilter(level) {
    currentFilter = level;
    expandedLogIds.clear(); // Clear expanded state when filter changes
    document.querySelectorAll('.metric-card').forEach(card => {
        card.classList.remove('active-indigo', 'active-blue', 'active-yellow', 'active-red');
        if (card.dataset.filter === level) {
            if (level === 'all') card.classList.add('active-indigo');
            else if (level === 'INFO') card.classList.add('active-blue');
            else if (level === 'WARNING') card.classList.add('active-yellow');
            else if (level === 'ERROR') card.classList.add('active-red');
        }
    });
    const indicator = document.getElementById('filter-indicator');
    const filterText = document.getElementById('active-filter');
    if (level === 'all') indicator.classList.add('hidden');
    else { 
        indicator.classList.remove('hidden'); 
        filterText.innerText = level; 
    }
    updateLogs();
}

// Update metrics
async function updateMetrics() {
    try {
        const res = await fetch('/api/metrics');
        const data = await res.json();
        animateNumberChange('metric-total', data.total || 0);
        animateNumberChange('metric-info', data.INFO || 0);
        animateNumberChange('metric-warning', data.WARNING || 0);
        animateNumberChange('metric-error', data.ERROR || 0);
    } catch (err) { 
        console.error("Metrics error:", err); 
    }
}

// Update logs table
async function updateLogs() {
    try {
        let url = `/api/logs?limit=${currentLimit}`;
        if (currentFilter !== 'all') url += `&level=${currentFilter}`;
        if (currentSearch) url += `&search=${encodeURIComponent(currentSearch)}`;
        
        const res = await fetch(url);
        const logs = await res.json();
        
        const tbody = document.getElementById('logs-table-body');
        tbody.innerHTML = '';

        if (logs.length === 0) {
            let filterMsg = '';
            if (currentFilter !== 'all') filterMsg += ` (level: ${currentFilter})`;
            if (currentSearch) filterMsg += ` (search: "${currentSearch}")`;
            tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-slate-500">No logs found${filterMsg}</td></tr>`;
            
            document.getElementById('current-count').innerText = '0';
            document.getElementById('limit-count').innerText = currentLimit;
            return;
        }

        logs.forEach((log) => {
            // 1. Create Main Row
            const tr = document.createElement('tr');
            tr.className = isAutoSimulating ? 'log-row fade-in hover:bg-slate-800/50' : 'log-row hover:bg-slate-800/50';
            
            // Check if this log was expanded before
            if (expandedLogIds.has(log.id)) {
                tr.classList.add('expanded');
            }
            
            const levelClass = getLevelStyles(log.level);
            tr.innerHTML = `
                <td class="px-6 py-4 font-mono text-xs text-slate-400">${log.timestamp}</td>
                <td class="px-6 py-4"><span class="px-3 py-1 rounded-full text-xs font-bold border ${levelClass}">${log.level}</span></td>
                <td class="px-6 py-4 font-medium text-slate-200">${log.source}</td>
                <td class="px-6 py-4 text-slate-300 flex items-center gap-2">
                    <svg class="chevron-icon w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    ${log.message}
                </td>
            `;
            
            // 2. Create Hidden Details Row
            const detailsTr = document.createElement('tr');
            detailsTr.className = 'details-row';
            
            // Check if this log was expanded before
            if (expandedLogIds.has(log.id)) {
                detailsTr.classList.add('show');
            }
            
            detailsTr.innerHTML = `
                <td colspan="4" class="px-6 py-4 border-t border-slate-700/50">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Raw Details / Stack Trace</span>
                        <button onclick="copyDetails(this, '${log.id}')" class="copy-btn flex items-center gap-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded border border-slate-600">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                            Copy
                        </button>
                    </div>
                    <pre class="whitespace-pre-wrap break-all text-xs text-slate-400 font-mono bg-slate-900/50 p-3 rounded border border-slate-700/50" id="details-text-${log.id}">${log.details || 'No additional details available.'}</pre>
                </td>
            `;

            // 3. Add Click Event to Toggle (UPDATED to track state)
            tr.onclick = function() {
                this.classList.toggle('expanded');
                detailsTr.classList.toggle('show');
                
                // Track expanded state
                if (expandedLogIds.has(log.id)) {
                    expandedLogIds.delete(log.id);
                } else {
                    expandedLogIds.add(log.id);
                }
            };

            tbody.appendChild(tr);
            tbody.appendChild(detailsTr);
        });
        
        document.getElementById('current-count').innerText = logs.length;
        document.getElementById('limit-count').innerText = currentLimit;
        
    } catch (err) { 
        console.error("❌ Logs error:", err); 
    }
}

// Copy to Clipboard Function
function copyDetails(button, logId) {
    const textToCopy = document.getElementById(`details-text-${logId}`).innerText;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        // Visual feedback
        const originalHTML = button.innerHTML;
        button.innerHTML = `
            <svg class="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <span class="text-green-400">Copied!</span>
        `;
        button.classList.add('border-green-500/50');
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.classList.remove('border-green-500/50');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Download logs
async function downloadLogs(format) {
    try {
        const exportLimit = 2000;
        let url = `/api/logs?limit=${exportLimit}`;
        if (currentFilter !== 'all') url += `&level=${currentFilter}`;
        if (currentSearch) url += `&search=${encodeURIComponent(currentSearch)}`;
        
        const res = await fetch(url);
        const logs = await res.json();

        if (logs.length === 0) {
            alert("No logs to export!");
            return;
        }

        let content = '';
        let mimeType = '';
        let extension = '';

        if (format === 'json') {
            content = JSON.stringify(logs, null, 2);
            mimeType = 'application/json';
            extension = 'json';
        } else if (format === 'csv') {
            const headers = ['Timestamp', 'Level', 'Source', 'Message'];
            const csvRows = [headers.join(',')];
            logs.forEach(log => {
                const safeMessage = `"${log.message.replace(/"/g, '""')}"`;
                csvRows.push(`${log.timestamp},${log.level},${log.source},${safeMessage}`);
            });
            content = csvRows.join('\n');
            mimeType = 'text/csv';
            extension = 'csv';
        }

        const blob = new Blob([content], { type: mimeType });
        const urlObj = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = urlObj;
        a.download = `logs_export_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(urlObj);
    } catch (err) {
        console.error("Export error:", err);
        alert("Failed to export logs.");
    }
}

// Toggle auto-simulation
function toggleAutoSimulate() {
    const btn = document.getElementById('simulate-btn');
    const btnText = document.getElementById('simulate-btn-text');
    const icon = document.getElementById('simulate-icon');
    
    if (isAutoSimulating) {
        clearInterval(autoSimulateInterval);
        autoSimulateInterval = null;
        isAutoSimulating = false;
        btnText.innerText = 'Start Auto Log';
        btn.classList.remove('bg-green-600', 'hover:bg-green-500', 'pulse-glow');
        btn.classList.add('bg-blue-600', 'hover:bg-blue-500');
        icon.classList.remove('spin-slow');
        updateLogs();
    } else {
        isAutoSimulating = true;
        btnText.innerText = 'Stop Auto Log';
        btn.classList.remove('bg-blue-600', 'hover:bg-blue-500');
        btn.classList.add('bg-green-600', 'hover:bg-green-500', 'pulse-glow');
        icon.classList.add('spin-slow');
        generateLog();
        autoSimulateInterval = setInterval(generateLog, 1000);
    }
}

// Generate a single log
async function generateLog() {
    try {
        await fetch('/api/simulate', { method: 'POST' });
        await updateMetrics();
        await updateLogs();
    } catch (err) { 
        console.error("Error generating log:", err); 
    }
}

// Clear all logs
async function clearLogs() {
    if (confirm("Are you sure you want to delete all logs? This cannot be undone.")) {
        try {
            const res = await fetch('/api/logs', { method: 'DELETE' });
            if (res.ok) { 
                expandedLogIds.clear();
                await updateMetrics(); 
                await updateLogs(); 
            }
        } catch (err) { 
            console.error("Error clearing logs:", err); 
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Dashboard initializing...');
    
    // Get slider elements
    const slider = document.getElementById('log-limit-slider');
    const limitValue = document.getElementById('limit-value');
    
    if (!slider) {
        console.error('❌ Slider element not found!');
        return;
    }
    
    console.log(`✅ Slider found. Initial value: ${slider.value}`);
    
    // Initialize currentLimit from slider value
    currentLimit = parseInt(slider.value) || 15;
    limitValue.innerText = currentLimit;
    
    // Slider event listeners
    slider.addEventListener('input', (e) => {
        currentLimit = parseInt(e.target.value);
        limitValue.innerText = currentLimit;
        console.log(`📊 Limit changed to: ${currentLimit}`);
        updateLogs();
    });
    
    slider.addEventListener('change', (e) => {
        currentLimit = parseInt(e.target.value);
        console.log(`✅ Limit finalized at: ${currentLimit}`);
    });
    
    // Search input event listener with debouncing
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        if (searchTimeout) clearTimeout(searchTimeout);
        
        searchTimeout = setTimeout(() => {
            currentSearch = e.target.value.trim();
            console.log(` Search term: "${currentSearch}"`);
            updateLogs();
        }, 300);
    });
    
    // Button event listeners
    document.getElementById('simulate-btn').addEventListener('click', toggleAutoSimulate);
    document.getElementById('clear-btn').addEventListener('click', clearLogs);

    // Initial load
    console.log('📥 Initial data fetch...');
    updateSystemMetrics();
    updateMetrics();
    updateLogs();
    
    // Poll for updates every 1 second
    setInterval(() => {
        updateSystemMetrics();
        updateMetrics();
        updateLogs();
    }, 1000);

    setupKeyboardShortcuts();
    
    console.log('✅ Dashboard ready!');
});

// Update System Metrics (CPU, RAM, Disk)
async function updateSystemMetrics() {
    try {
        const res = await fetch('/api/system-metrics');
        const data = await res.json();

        // Update CPU
        document.getElementById('sys-cpu-text').innerText = `${data.cpu}%`;
        document.getElementById('sys-cpu-bar').style.width = `${data.cpu}%`;

        // Update RAM
        document.getElementById('sys-ram-text').innerText = `${data.ram_percent}%`;
        document.getElementById('sys-ram-bar').style.width = `${data.ram_percent}%`;
        document.getElementById('sys-ram-used').innerText = data.ram_used;
        document.getElementById('sys-ram-total').innerText = data.ram_total;

        // Update Disk
        document.getElementById('sys-disk-text').innerText = `${data.disk_percent}%`;
        document.getElementById('sys-disk-bar').style.width = `${data.disk_percent}%`;
        document.getElementById('sys-disk-used').innerText = data.disk_used;
        document.getElementById('sys-disk-total').innerText = data.disk_total;

    } catch (err) {
        console.error("System metrics error:", err);
    }
}

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const searchInput = document.getElementById('search-input');
        const isTyping = document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA';
        
        // Press "/" to focus search bar (only if not already typing)
        if (e.key === '/' && !isTyping) {
            e.preventDefault();
            searchInput.focus();
            console.log('⌨️ Shortcut: Focus search bar');
        }
        
        // Press "Space" to toggle auto-log (only if not typing)
        if (e.key === ' ' && !isTyping) {
            e.preventDefault();
            toggleAutoSimulate();
            console.log('⌨️ Shortcut: Toggle auto-log');
        }
        
        // Press "Escape" to clear search and blur
        if (e.key === 'Escape') {
            searchInput.value = '';
            currentSearch = '';
            searchInput.blur();
            updateLogs();
            console.log('⌨️ Shortcut: Clear search');
        }
    });
}