import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import articlesRoutes from './routes/articlesRoutes.js';
import projectsRoutes from './routes/projectsRoutes.js';
import seoCriteriaRoutes from './routes/seoCriteriaRoutes.js';
import usersRoutes from './routes/usersRoutes.js';

const app = express();

// CORS: Autoriser toutes les origines pour le moment (debug)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Headers CORS manuels pour être sûr
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Parser JSON et urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/seo-criteria', seoCriteriaRoutes);
app.use('/api/users', usersRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'RedacSeo API is running',
    timestamp: new Date().toISOString(),
    frontendUrl: process.env.FRONTEND_URL || 'NOT SET',
    nodeEnv: process.env.NODE_ENV || 'NOT SET'
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

export default app;
