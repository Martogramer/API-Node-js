import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['patient', 'professional', 'admin'],
    default: 'patient'
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  specialty: {
    type: String,
    required: function () {
      return this.role === 'professional'
    }
  }
}, { timestamps: true })

export default mongoose.model('User', userSchema)
