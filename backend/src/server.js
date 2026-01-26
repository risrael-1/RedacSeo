import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';

const PORT = process.env.PORT ?? 3000;

// Démarrage du serveur
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL ?? 'http://localhost:5173'}`);
});
