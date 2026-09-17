const GRID_SIZE = 32;
const TOTAL_BLOCKS = GRID_SIZE * GRID_SIZE;
const BLOCK_SIZE = 18;
const PADDING = 2;

const STATE_FREE = 0;
const STATE_ALLOCATED = 1;
const STATE_CORRUPTED = 2;
const STATE_PINNED = 3;

let disk = new Uint8Array(TOTAL_BLOCKS);

const canvas = document.getElementById('disk-canvas');
const ctx = canvas.getContext('2d');

const elTotal = document.getElementById('metric-total');
const elUsed = document.getElementById('metric-used');
const elBad = document.getElementById('metric-bad');
const elFrag = document.getElementById('metric-frag');
const elHover = document.getElementById('metric-hover');
const elLog = document.getElementById('event-log');
const elFsStatus = document.getElementById('fs-status');

let hoveredBlock = null;

function logEvent(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.textContent = `[${timestamp}] ${message}`;
    elLog.prepend(entry);
    
    while (elLog.children.length > 100) {
        elLog.removeChild(elLog.lastChild);
    }
}

function initDisk() {
    disk.fill(STATE_FREE);
    // Allocate some initial sample data
    for (let i = 0; i < TOTAL_BLOCKS * 0.35; i++) {
        const idx = Math.floor(Math.random() * TOTAL_BLOCKS);
        disk[idx] = STATE_ALLOCATED;
    }
    // Pin a few blocks
    for (let i = 0; i < 15; i++) {
        const idx = Math.floor(Math.random() * TOTAL_BLOCKS);
        if (disk[idx] === STATE_ALLOCATED) {
            disk[idx] = STATE_PINNED;
        }
    }
    logEvent('Filesystem initialized. 1024 blocks allocated.', 'success');
    updateMetrics();
    drawDisk();
}

function drawDisk() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const idx = y * GRID_SIZE + x;
            const state = disk[idx];
            
            let color = '#1e222d'; // FREE
            if (state === STATE_ALLOCATED) color = '#3b82f6';
            else if (state === STATE_CORRUPTED) color = '#ef4444';
            else if (state === STATE_PINNED) color = '#8b5cf6';
            
            ctx.fillStyle = color;
            ctx.fillRect(x * (BLOCK_SIZE + PADDING), y * (BLOCK_SIZE + PADDING), BLOCK_SIZE, BLOCK_SIZE);
            
            if (hoveredBlock === idx) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.strokeRect(x * (BLOCK_SIZE + PADDING) - 1, y * (BLOCK_SIZE + PADDING) - 1, BLOCK_SIZE + 2, BLOCK_SIZE + 2);
            }
        }
    }
}

function updateMetrics() {
    let used = 0;
    let bad = 0;
    let free = 0;
    let pinned = 0;
    
    for (let i = 0; i < TOTAL_BLOCKS; i++) {
        if (disk[i] === STATE_ALLOCATED) used++;
        else if (disk[i] === STATE_CORRUPTED) bad++;
        else if (disk[i] === STATE_PINNED) pinned++;
        else if (disk[i] === STATE_FREE) free++;
    }
    
    const totalUsed = used + pinned;
    const usedPercent = ((totalUsed / TOTAL_BLOCKS) * 100).toFixed(1);
    
    elTotal.textContent = TOTAL_BLOCKS;
    elUsed.textContent = `${totalUsed} (${usedPercent}%)`;
    elBad.textContent = bad;
    
    // Simple fragmentation metric calculation
    let transitions = 0;
    for (let i = 0; i < TOTAL_BLOCKS - 1; i++) {
        if (disk[i] !== disk[i + 1]) transitions++;
    }
    const fragPercent = Math.min(100, ((transitions / TOTAL_BLOCKS) * 100).toFixed(1));
    elFrag.textContent = `${fragPercent}%`;
    
    if (bad > 0) {
        elFsStatus.textContent = `Filesystem: Degraded (${bad} bad sectors)`;
        elFsStatus.className = 'badge danger';
    } else {
        elFsStatus.textContent = 'Filesystem: Healthy';
        elFsStatus.className = 'badge ok';
    }
}

function allocateBlock() {
    let allocatedCount = 0;
    for (let i = 0; i < 32; i++) {
        const idx = Math.floor(Math.random() * TOTAL_BLOCKS);
        if (disk[idx] === STATE_FREE) {
            disk[idx] = STATE_ALLOCATED;
            allocatedCount++;
        }
    }
    logEvent(`Allocated ${allocatedCount} new blocks.`, 'info');
    updateMetrics();
    drawDisk();
}

function injectFault() {
    let corruptedCount = 0;
    for (let i = 0; i < 8; i++) {
        const idx = Math.floor(Math.random() * TOTAL_BLOCKS);
        if (disk[idx] !== STATE_PINNED) {
            disk[idx] = STATE_CORRUPTED;
            corruptedCount++;
        }
    }
    logEvent(`Injected faults: ${corruptedCount} sectors corrupted.`, 'warning');
    updateMetrics();
    drawDisk();
}

function runSelfTest() {
    logEvent('Running file system consistency check (fsck)...', 'info');
    setTimeout(() => {
        let badFound = 0;
        for (let i = 0; i < TOTAL_BLOCKS; i++) {
            if (disk[i] === STATE_CORRUPTED) badFound++;
        }
        logEvent(`fsck complete. Found ${badFound} corrupted sectors requiring repair.`, badFound > 0 ? 'warning' : 'success');
    }, 400);
}

function defragDisk() {
    logEvent('Starting disk defragmentation...', 'info');
    let writeHead = 0;
    for (let i = 0; i < TOTAL_BLOCKS; i++) {
        if (disk[i] === STATE_ALLOCATED) {
            if (i !== writeHead) {
                disk[writeHead] = STATE_ALLOCATED;
                disk[i] = STATE_FREE;
            }
            writeHead++;
        } else if (disk[i] === STATE_PINNED) {
            writeHead = i + 1;
        }
    }
    logEvent('Defragmentation completed successfully.', 'success');
    updateMetrics();
    drawDisk();
}

function resetDisk() {
    initDisk();
    logEvent('Disk storage formatted and reset.', 'warning');
}

function exportSnapshot() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(Array.from(disk)));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "disk_snapshot.json");
    dlAnchorElem.click();
    logEvent('Disk snapshot exported to JSON.', 'success');
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (BLOCK_SIZE + PADDING));
    const y = Math.floor((e.clientY - rect.top) / (BLOCK_SIZE + PADDING));
    
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        const idx = y * GRID_SIZE + x;
        hoveredBlock = idx;
        const stateStr = ['Free', 'Allocated', 'Corrupted', 'Pinned'][disk[idx]];
        elHover.textContent = `Block #${idx} (${x}, ${y}): ${stateStr}`;
    } else {
        hoveredBlock = null;
        elHover.textContent = 'None';
    }
    drawDisk();
});

canvas.addEventListener('mouseleave', () => {
    hoveredBlock = null;
    elHover.textContent = 'None';
    drawDisk();
});

window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    if (e.code === 'Space') {
        e.preventDefault();
        runSelfTest();
    } else if (e.code === 'KeyC') {
        injectFault();
    } else if (e.code === 'KeyR' && e.shiftKey) {
        resetDisk();
    } else if (e.code === 'KeyR') {
        defragDisk();
    } else if (e.code === 'KeyA') {
        allocateBlock();
    }
});

document.getElementById('btn-allocate').addEventListener('click', allocateBlock);
document.getElementById('btn-fault').addEventListener('click', injectFault);
document.getElementById('btn-test').addEventListener('click', runSelfTest);
document.getElementById('btn-defrag').addEventListener('click', defragDisk);
document.getElementById('btn-reset').addEventListener('click', resetDisk);
document.getElementById('btn-export').addEventListener('click', exportSnapshot);

initDisk();
