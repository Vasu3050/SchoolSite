import { ApiResponse } from "../Utils/ApiResponse.js";
import { asyncHandler } from "../Utils/asyncHandler.js";

const healthCheck = asyncHandler( async (req, res) =>{
    res.status(200).json( new ApiResponse(
        200,
        {},
        "Everything is ok!!"
    ));
}); // tested Ok

export { healthCheck }