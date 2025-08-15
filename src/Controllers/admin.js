import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { User } from "../Models/user.models.js";


const adminRegister = asyncHandler ( async (req,res) => {
    const { name, email, password } = req.body;

    if ( !name || !email || !password ) {
        return res.status(400).json(new ApiResponse(
            400,
            {},
            "Please provide all required fields"
        ));
    }
    
    const existingUser = await User.findOne(
        {
            $or : [ { email }, { name } ]
        }
    );

    if ( existingUser ) {
        return res.status(400).json(
            new ApiResponse(
                400,
                {},
                "Admin with this email or name already exists"
            )   
        )
    } 

    const admin = await User.create({
        name,
        email,
        password,
        role: "admin",
        status: "active",
    });

    if ( !admin ) {
        return res.status(500).json(
            new ApiResponse(
                500,
                {},
                "Failed to create admin, please try again later"
            )
        );
    }



    const createdAdmin = await User.findById(admin._id).select("-password -refreshToken -__v -createdAt -updatedAt");
    
    if ( !createdAdmin ) {
        return res.status(500).json(
            new ApiResponse(
                500,
                {},
                "Failed to retrieve created admin, please try again later"
            )
        );
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            { user: createdAdmin },
            "Admin registered successfully"
        )
    );

});

export { adminRegister };
