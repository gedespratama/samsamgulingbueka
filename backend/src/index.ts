import { app } from './app.js';
import { config } from './config.js';
import { initDb } from './db/migrate.js';

initDb()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`API Samsam Guling Bu Eka berjalan di http://localhost:${config.port}`);
      console.log(`Database: ${config.databaseUrl}`);
    });
  })
  .catch((err) => {
    console.error('Gagal menginisialisasi database:', err);
    process.exit(1);
  });
