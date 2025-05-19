import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';


const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes)

app.get('/', (req, res) => {
  res.send('API de gestión de turnos - Clínica');
});

export default app;
