import { ApiResponse } from "../Utils/ApiResponse";
import { asyncHandler } from "../Utils/asyncHandler";

const healthCheck = asyncHandler( async (req, res) =>{
    res.status(200).json( new ApiResponse(
        200,
        {},
        "Everything is ok!!"
    ));
});

export { healthCheck }