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
import userRoute from "./Routes/user.route.js";
import studentRoute from "./Routes/student.route.js";
import teacherRoute from "./Routes/teacher.route.js";
import parentRoute from "./Routes/parent.route.js";
import attendanceRoute from "./Routes/Attendance.route.js";
import dailyDiary from "./Routes/dailyDiary.route.js";




//route path declarations

app.use("/api/v1/healthCheck", healthCheck); // All done
app.use("/api/v1/users", userRoute); // pending
app.use("/api/v1/students", studentRoute); // pending
app.use("/api/v1/teachers", teacherRoute); // pending
app.use("/api/v1/parents", parentRoute); // pending
app.use("/api/v1/attendance", attendanceRoute); // All done
app.use("/api/v1/diary",dailyDiary);// All done


//notification feature
//photo gallery
//notice Board


export { app };


