import { User } from "../Models/user.models.js";
import { ApiError } from "../Utils/ApiError.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
    if (!token) {
        throw new ApiError(401, "Access token is missing or invalid.");
    }
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log("Decoded JWT:", decoded); // For debugging purposes
        req.user = decoded;
        next();
    } catch (error) {
        throw new ApiError(401, "Invalid access token.");
    }
});

