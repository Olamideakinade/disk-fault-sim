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
const elHover = document.getElementById('hover-info');
const elLog = document.getElementById('log-output');
const elFsStatus = document.getElementById('fs-status');

function initDisk() {
    disk.fill(STATE_FREE);
    // Pin metadata blocks (Inode table & superblock)
    for (let i = 0; i < 32; i++) {
        disk[i] = STATE_PINNED;
    }
    logMessage('Filesystem initialized. Superblock and Inodes pinned.', 'info');
    updateMetrics();
    render();
}

function logMessage(msg, type = 'info') {
    const time = new Date().toTimeString().split(' ')[0];
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">[${time}]</span><span class="log-msg ${type}">${msg}</span>`;
    elLog.appendChild(entry);
    elLog.scrollTop = elLog.scrollHeight;
}

function updateMetrics() {
    let used = 0;
    let bad = 0;
    let freeContiguousChanges = 0;
    let lastState = STATE_FREE;

    for (let i = 0; i < TOTAL_BLOCKS; i++) {
        if (disk[i] === STATE_ALLOCATED) used++;
        if (disk[i] === STATE_CORRUPTED) bad++;
        if (disk[i] !== lastState && disk[i] !== STATE_PINNED) {
            freeContiguousChanges++;
        }
        lastState = disk[i];
    }

    const totalKb = TOTAL_BLOCKS;
    const usedKb = used;
    const fragRate = used > 0 ? Math.min(100, (freeContiguousChanges / used) * 45).toFixed(1) : '0.0';

    elTotal.textContent = `${totalKb} KB`;
    elUsed.textContent = `${usedKb} KB`;
    elBad.textContent = bad;
    elFrag.textContent = `${fragRate}%`;

    if (bad > 0) {
        elFsStatus.textContent = `Filesystem: Degraded (${bad} bad sectors)`;
        elFsStatus.className = 'badge error';
    } else {
        elFsStatus.textContent = 'Filesystem: Healthy';
        elFsStatus.className = 'badge ok';
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const idx = y * GRID_SIZE + x;
            const state = disk[idx];

            switch (state) {
                case STATE_FREE:
                    ctx.fillStyle = '#1e222d';
                    break;
                case STATE_ALLOCATED:
                    ctx.fillStyle = '#3b82f6';
                    break;
                case STATE_CORRUPTED:
                    ctx.fillStyle = '#ef4444';
                    break;
                case STATE_PINNED:
                    ctx.fillStyle = '#8b5cf6';
                    break;
            }

            ctx.fillRect(
                x * (BLOCK_SIZE + PADDING) + PADDING,
                y * (BLOCK_SIZE + PADDING) + PADDING,
                BLOCK_SIZE,
                BLOCK_SIZE
            );
        }
    }
}

function allocateFile() {
    const size = 16;
    let allocatedCount = 0;
    let startBlock = -1;

    for (let i = 0; i < TOTAL_BLOCKS; i++) {
        if (disk[i] === STATE_FREE) {
            if (startBlock === -1) startBlock = i;
            disk[i] = STATE_ALLOCATED;
            allocatedCount++;
            if (allocatedCount === size) break;
        }
    }

    if (allocatedCount < size) {
        logMessage(`ENOSPC: Failed to allocate ${size} blocks. Disk full.`, 'error');
    } else {
        logMessage(`Allocated file of ${size} blocks starting at offset 0x${startBlock.toString(16)}`, 'success');
    }

    updateMetrics();
    render();
}

function simulateFragmentation() {
    let modified = 0;
    for (let i = 32; i < TOTAL_BLOCKS; i += 3) {
        if (disk[i] === STATE_ALLOCATED) {
            disk[i] = STATE_FREE;
            modified++;
        }
    }
    logMessage(`Fragmented filesystem: freed ${modified} alternating blocks.`, 'warn');
    updateMetrics();
    render();
}

function injectCorruption() {
    const target = Math.floor(Math.random() * (TOTAL_BLOCKS - 32)) + 32;
    if (disk[target] !== STATE_PINNED) {
        disk[target] = STATE_CORRUPTED;
        logMessage(`Hardware warning: Sector 0x${target.toString(16)} unreadable / corrupted.`, 'error');
        updateMetrics();
        render();
    }
}

function runDefrag() {
    let writePtr = 32;
    let movedCount = 0;

    for (let i = 32; i < TOTAL_BLOCKS; i++) {
        if (disk[i] === STATE_ALLOCATED) {
            if (i !== writePtr) {
                disk[writePtr] = STATE_ALLOCATED;
                disk[i] = STATE_FREE;
                movedCount++;
            }
            writePtr++;
        } else if (disk[i] === STATE_CORRUPTED) {
            // Skip bad sectors during defrag relocation
            writePtr = Math.max(writePtr, i + 1);
        }
    }

    logMessage(`Defragmentation complete. Relocated ${movedCount} blocks.`, 'success');
    updateMetrics();
    render();
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const x = Math.floor(mouseX / (BLOCK_SIZE + PADDING));
    const y = Math.floor(mouseY / (BLOCK_SIZE + PADDING));

    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        const idx = y * GRID_SIZE + x;
        const state = disk[idx];
        let stateStr = 'Free';
        if (state === STATE_ALLOCATED) stateStr = 'Allocated';
        if (state === STATE_CORRUPTED) stateStr = 'Corrupted';
        if (state === STATE_PINNED) stateStr = 'Pinned (Metadata)';

        elHover.textContent = `Block 0x${idx.toString(16).padStart(3, '0')} [${stateStr}]`;
    }
});

canvas.addEventListener('mouseleave', () => {
    elHover.textContent = 'Hover over block for details';
});

document.getElementById('btn-allocate').addEventListener('click', allocateFile);
document.getElementById('btn-fragment').addEventListener('click', simulateFragmentation);
document.getElementById('btn-corrupt').addEventListener('click', injectCorruption);
document.getElementById('btn-defrag').addEventListener('click', runDefrag);
document.getElementById('btn-reset').addEventListener('click', initDisk);

initDisk();
