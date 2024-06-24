import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser=asyncHandler(async(req,res)=>{
   // get user details from fronted(details which we have described in user model)
   // validation-(atleast check for non empty)
   // check if user already exists: username, email
   // check for images, check for avatar
   // upload them to cloudinary
   // create user object - create entry in db
   // remove password and refresh token field from response
   // check for user creation
   // return response(if user created),else error response

   //getting user details from frontend:

   const{fullName,email,username,password}=req.body
   console.log("email",email)

    //validation:
    if(
        [fullName,email,username,password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required")
    }

    //checking if user already exists:
    const existedUser=User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }

    //checking for images,avatar:
    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required")
    }

    //uploading to cloudinary:
    const avatar=await uploadOnCloudinary(avatarLocalPath);//issi await ki wajah se registerUser method ko async banaya hai
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);

    //checking whether avatar has been uploaded or not:
    if(!avatar){
        throw new ApiError(400,"Avatar is required")
    }

    //creating user 
    const user=await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })
   //removing password and refreshToken fields from response
   const createdUser= await User.findById(user._id).select(
       "-password -refreshToken"
   )

   //checking for user creation
   if(!createdUser){
       throw new ApiError(500,"Something went wrong while registering the user")
   }

   //returning response
   return res.status(201).json(
       new ApiResponse(200,createdUser,"User registered successfully.")
   )
})

export {registerUser}