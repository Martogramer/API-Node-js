import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import postRoute from "./routes/post.route.js";
import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";

const app = express();

app.use(cors({origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());


app.use("/api/auth", authRoute);
app.use("/api/posts", postRoute); 
app.use("/api/users", userRoute);
//app.use("/api/chats", chatRoute);
//app.use("/api/test", testRoute);
//app.use("/api/messages", messageRoute);

app.listen(3000, () => {
  console.log("Escuchando");
});
