import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({limit: "24kb"}));
app.use(express.urlencoded({extended: true, limit: "24kb"}));
app.use(express.static("public"));
app.use(cookieParser());

// Server : http//localhost:3000/api/v<current_v>/<router_name>

// router imports ...
import healthCheck from "./Routes/healthCheck.js";



//route path declarations

app.use("/api/v1/healthCheck", healthCheck);



export { app };


