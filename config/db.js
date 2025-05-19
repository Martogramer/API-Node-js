import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Conectado a la base de datos');
  } catch (err) {
    console.error('❌ Error al conectar a la base de datos', err);
    process.exit(1);
  }
};
