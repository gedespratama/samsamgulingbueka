import { runSeed } from '../db/seed.js';

runSeed(true)
  .then(() => {
    console.log('Seed selesai: database di-reset dan diisi ulang.');
    process.exit(0);
  })
  .catch((err: unknown) => {
    console.error('Gagal seed:', err);
    process.exit(1);
  });
