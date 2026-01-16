import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import articlesRoutes from './routes/articlesRoutes.js';
import rulesRoutes from './routes/rulesRoutes.js';
import projectsRoutes from './routes/projectsRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

// Liste des origines autorisées
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL
].filter(Boolean);

console.log('🔐 Allowed CORS origins:', allowedOrigins);

// Configuration CORS dynamique
const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origin (comme curl, Postman)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

// Middleware CORS global
app.use(cors(corsOptions));

// Répondre explicitement aux préflight OPTIONS
app.options("*", cors(corsOptions));

// Parser JSON et urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/projects', projectsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'RedacSeo API is running',
    timestamp: new Date().toISOString(),
    allowedOrigins: allowedOrigins,
    frontendUrl: process.env.FRONTEND_URL || 'NOT SET'
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Démarrage du serveur
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL ?? 'http://localhost:5173'}`);
});
