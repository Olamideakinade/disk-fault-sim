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
const ctx = canvas ? canvas.getContext('2d') : null;

const elTotal = document.getElementById('metric-total');
const elUsed = document.getElementById('metric-used');
const elBad = document.getElementById('metric-bad');
const elFrag = document.getElementById('metric-frag');

function updateMetrics() {
    let used = 0;
    let bad = 0;
    for (let i = 0; i < TOTAL_BLOCKS; i++) {
        if (disk[i] === STATE_ALLOCATED || disk[i] === STATE_PINNED) used++;
        if (disk[i] === STATE_CORRUPTED) bad++;
    }
    if (elTotal) elTotal.textContent = TOTAL_BLOCKS;
    if (elUsed) elUsed.textContent = used;
    if (elBad) elBad.textContent = bad;
    if (elFrag) {
        let transitions = 0;
        for (let i = 0; i < TOTAL_BLOCKS - 1; i++) {
            if (disk[i] !== disk[i + 1]) transitions++;
        }
        const fragScore = Math.min(100, Math.round((transitions / TOTAL_BLOCKS) * 100));
        elFrag.textContent = fragScore + '%';
    }
}

function renderDisk() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const idx = y * GRID_SIZE + x;
            const state = disk[idx];
            
            if (state === STATE_FREE) ctx.fillStyle = '#1e222d';
            else if (state === STATE_ALLOCATED) ctx.fillStyle = '#3b82f6';
            else if (state === STATE_CORRUPTED) ctx.fillStyle = '#ef4444';
            else if (state === STATE_PINNED) ctx.fillStyle = '#8b5cf6';
            
            ctx.fillRect(
                x * (BLOCK_SIZE + PADDING) + PADDING,
                y * (BLOCK_SIZE + PADDING) + PADDING,
                BLOCK_SIZE,
                BLOCK_SIZE
            );
        }
    }
}

function runTestsInUI() {
    if (!window.DiskTestSuite) return;
    const unitResults = window.DiskTestSuite.runUnitTests();
    const benchResults = window.DiskTestSuite.runBenchmarks();
    
    console.group('Disk Fault Simulation Workbench - v1.2.0 Test Suite');
    console.log('--- Unit Tests ---');
    unitResults.forEach(r => {
        if (r.passed) console.log(`[PASS] ${r.name}`);
        else console.error(`[FAIL] ${r.name}: ${r.error}`);
    });
    console.log('--- Benchmarks ---');
    benchResults.forEach(b => {
        console.log(`[BENCH] ${b.name}: ${b.durationMs}ms (${b.opsPerSec} ops/sec)`);
    });
    console.groupEnd();
}

document.addEventListener('DOMContentLoaded', () => {
    updateMetrics();
    renderDisk();
    runTestsInUI();
});
