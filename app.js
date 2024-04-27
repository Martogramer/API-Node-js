import express from "express";
import cors from  "cors"
import postRoute from './routes/post.route.js'

const app = express();

app.use(cors())

app.listen(3000, ()=>{
  console.log("Escuchando");
})

app.use('/api/posts', postRoute)
