class TestRunner {
    constructor() {
        this.tests = [];
        this.benchmarks = [];
    }

    add(name, fn) {
        this.tests.push({ name, fn });
    }

    benchmark(name, fn) {
        this.benchmarks.push({ name, fn });
    }

    runUnitTests() {
        const results = [];
        for (const test of this.tests) {
            try {
                test.fn();
                results.push({ name: test.name, passed: true, error: null });
            } catch (err) {
                results.push({ name: test.name, passed: false, error: err.message });
            }
        }
        return results;
    }

    runBenchmarks() {
        const results = [];
        for (const bench of this.benchmarks) {
            const start = performance.now();
            const iterations = 1000;
            for (let i = 0; i < iterations; i++) {
                bench.fn();
            }
            const duration = performance.now() - start;
            const opsPerSec = Math.round((iterations / duration) * 1000);
            results.push({ name: bench.name, durationMs: duration.toFixed(2), opsPerSec });
        }
        return results;
    }
}

const testRunner = new TestRunner();

testRunner.add('Disk Initialization', () => {
    const disk = new Uint8Array(1024);
    if (disk.length !== 1024) throw new Error('Incorrect disk size');
    if (disk[0] !== 0) throw new Error('Initial state should be free');
});

testRunner.add('Block Allocation', () => {
    const disk = new Uint8Array(100);
    let allocated = 0;
    for (let i = 0; i < 50; i++) {
        if (disk[i] === 0) {
            disk[i] = 1;
            allocated++;
        }
    }
    if (allocated !== 50) throw new Error('Failed to allocate 50 blocks');
    if (disk[0] !== 1 || disk[50] !== 0) throw new Error('Allocation boundary error');
});

testRunner.add('Fault Injection & Corruption', () => {
    const disk = new Uint8Array(100);
    disk[10] = 1; // Allocated
    disk[10] = 2; // Corrupted
    if (disk[10] !== 2) throw new Error('Corruption state not applied');
});

testRunner.benchmark('Disk Allocation Scan', () => {
    const disk = new Uint8Array(1024);
    let count = 0;
    for (let i = 0; i < disk.length; i++) {
        if (disk[i] === 0) {
            disk[i] = 1;
            count++;
            if (count > 50) break;
        }
    }
});

testRunner.benchmark('Fragmentation Metric Calculation', () => {
    const disk = new Uint8Array(1024);
    for (let i = 0; i < 1024; i += 2) disk[i] = 1;
    let transitions = 0;
    for (let i = 0; i < disk.length - 1; i++) {
        if (disk[i] !== disk[i + 1]) transitions++;
    }
});

window.DiskTestSuite = testRunner;
