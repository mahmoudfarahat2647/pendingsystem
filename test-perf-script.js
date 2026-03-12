// A simple benchmark to compare sequential vs concurrent execution of async tasks
const performance = require('perf_hooks').performance;

// Mock the async task (simulates saveMutation.mutateAsync)
async function mockMutateAsync(item) {
  // simulate network latency (e.g., 50ms)
  await new Promise(resolve => setTimeout(resolve, 50));
  return true;
}

const items = Array.from({ length: 50 }).map((_, i) => ({ id: i }));

async function testSequential() {
  const start = performance.now();
  let total = 0;
  for (const item of items) {
    await mockMutateAsync(item);
    total++;
  }
  const end = performance.now();
  return end - start;
}

async function testChunks() {
  const start = performance.now();
  let total = 0;
  const CHUNK_SIZE = 10;
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    await Promise.all(chunk.map(item => mockMutateAsync(item)));
    total += chunk.length;
  }
  const end = performance.now();
  return end - start;
}

async function run() {
  console.log("Running baseline (sequential)...");
  const t1 = await testSequential();
  console.log(`Sequential: ${t1.toFixed(2)}ms`);

  console.log("Running optimized (chunks)...");
  const t2 = await testChunks();
  console.log(`Chunks: ${t2.toFixed(2)}ms`);

  const improvement = ((t1 - t2) / t1 * 100).toFixed(2);
  console.log(`Improvement: ${improvement}%`);
}

run();
