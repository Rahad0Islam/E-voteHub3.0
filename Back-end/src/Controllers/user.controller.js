import { User } from "../Models/User.Model.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { AsynHandler } from "../Utils/AsyncHandler.js";
import { FileDelete, FileUpload } from "../Utils/Cloudinary.js";
import jwt from 'jsonwebtoken';

const Option={
    httpOnly:true,
    secure:true
}


const GenerateAccessAndRefreshToken=async function (UserID) {

  try {
      const user=await User.findById(UserID);
      if(!user)throw new ApiError(501,"user not found ! ")

      const AccessToken=  user.GenerateAccessToken();
      const RefreshToken=user.GenerateRefreshToken();
  
      user.RefreshToken=RefreshToken;
      await user.save({validateBeforeSave:false})
      return {AccessToken,RefreshToken}
  } catch (error) {
      throw new ApiError(501,"cannot generate access and refresstoken ")
  }
}


const Register=AsynHandler(async(req,res)=>{
  console.log("hhelo");

    const {FullName="",UserName="",Email="",DateOfBirth="",Gender="",Password="",NID="",PhoneNumber=""}=req.body;
    console.log(UserName,"   dff");
    if(FullName==="" || UserName==="" || 
        Email==="" || DateOfBirth===""||
         Gender==="" || Password==="" || NID===""){
            throw new ApiError(401,"All feilds are required")
         }

    const AlreadyExistEmailUsername= await User.findOne({
        $or:[{Email},{UserName}]
    })

    if(AlreadyExistEmailUsername)throw new ApiError(401,"Username or Email already Exist");

    let ProfileImageLocalPath="";
    let CoverImageLocalPath="";

    if (
            Array.isArray(req.files?.ProfileImage) &&
            req.files?.ProfileImage.length > 0 &&
            Array.isArray(req.files?.CoverImage) &&
            req.files?.CoverImage.length > 0)
       {
      ProfileImageLocalPath=req.files?.ProfileImage[0]?.path;
      CoverImageLocalPath= req.files?.CoverImage[0]?.path;
    }



    if(!ProfileImageLocalPath){
        throw new ApiError(401,"profile picture is required");
    }
    if(!CoverImageLocalPath){
        throw new ApiError(401,"Cover image is required");
    }
    
    console.log(ProfileImageLocalPath);
    console.log(CoverImageLocalPath);

    const ProfileImage=await FileUpload(ProfileImageLocalPath);
    const CoverImage=await FileUpload(CoverImageLocalPath);

    if(!ProfileImage || !CoverImage)throw new ApiError(501,"Cloudinary problem")
    
    
   const user=await User.create({
      FullName,
      UserName,
      Email,
      DateOfBirth,
      Gender,
      Password,
      NID,
      PhoneNumber,
      ProfileImage:ProfileImage?.url,
      CoverImage:CoverImage?.url,
      ProfilePublicId:ProfileImage?.public_id,
      CoverPublicId:CoverImage?.public_id
   })

   const CreateUser=await User.findById(user._id).select("-Password -RefreshToken");
   if(!CreateUser)throw new ApiError(501,"Something Went Wrong while regestering! ")

    return res.status(201).json(new ApiResponse(201,CreateUser,"Registered succesfully! "))
})


const LogIn=AsynHandler(async(req,res)=>{

    
    const {UserName,Email,Password}=req.body;

    if ((!UserName?.trim() && !Email?.trim()) || !Password?.trim()) {
    throw new ApiError(401, "Username or Email and Password are required!");
    }

    const user=await User.findOne({
        $or:[{Email},{UserName}]
    })

    if(!user)throw new ApiError(401,"user not found!");

    const IsPassCorr=await user.IsPasswordCorrect(Password)
    if(!IsPassCorr)throw new ApiError(401,"Password is not correct ");

    const {AccessToken,RefreshToken}=await GenerateAccessAndRefreshToken(user._id)
    console.log("AccessToken : ",AccessToken);
    
    const LogInUser=await User.findById(user._id).select("-Password -RefreshToken")
    if(!LogInUser)throw new ApiError(501,"User not found")

    console.log("Log in succesfully! ");
    return res
    .status(201)
    .cookie("AccessToken",AccessToken,Option)
    .cookie("RefreshToken",RefreshToken,Option)
    .json(
        new ApiResponse(201,{AccessToken,RefreshToken,LogInUser},"log in successfully ")
    )

})

const LogOut=AsynHandler(async(req,res)=>{

   const L_user= await User.findByIdAndUpdate(req.user._id,{
        $unset:{RefreshToken:""}
    },
    {
         new:true   //RETURN USER DB AFTER UPDATE
    }

    )
        
    
    console.log("Log out SuccesFully!");
    return res
    .status(201)
    .clearCookie('AccessToken',Option)
    .clearCookie('RefreshToken',Option)
    .json(
        new ApiResponse(201,L_user,"Logout Succesfully!")
    )
})

const RenewAccesToken=AsynHandler(async(req,res)=>{
      const IncomingRefreshToken=req.cookies?.RefreshToken || req.body?.RefreshToken
       || (await User.findById(req.user?._id).select("RefreshToken"))?.RefreshToken;
    

        if(!IncomingRefreshToken)throw new ApiError(401,"Refresh token invalid !")


        try {
    
          const Decode_User_id=jwt.verify(IncomingRefreshToken,process.env.REFRESS_TOKEN_SECRET);
    
          const user=await User.findById(Decode_User_id?._id);
          if(!user)throw new ApiError(401,"invalid refresh token")
    
    
          if(IncomingRefreshToken!==user?.RefreshToken)throw new ApiError(401,"Refresh token expired ")
    
          const{AccessToken,RefreshToken} = await GenerateAccessAndRefreshToken(user?._id);
          console.log("renew the access token ");
        
          return res
          .status(201)
          .cookie("AccessToken",AccessToken,Option)
          .cookie("RefreshToken",RefreshToken,Option)
          .json(
            new ApiResponse(201,{AccessToken,RefreshToken},"Renew the accesstoken !")
          )

    } catch (error) {
        throw new ApiError(401,"invalid refresh token(catch)")
    }

})


const ChangePassword=AsynHandler(async(req,res)=>{
    const {NewPassword,OldPassword}=req.body
    //check password is correct or wrong

    const user=await User.findById(req.user?._id);
    if(!user)throw new ApiError(401,"User not found ! ");

    const IsPassCorr=await user.IsPasswordCorrect(OldPassword);
    if(!IsPassCorr)throw new ApiError(401,"Current Password is incorrect! ");

    user.Password=NewPassword;
    const SavePass=await user.save({validateBeforeSave:false});   
    console.log("Password changed successfully");

    return res
    .status(201)
    .json(
        new ApiResponse(201,{"savePass":SavePass},"Password changed successfully! ")
    )

})

const UpdateProfilePic=AsynHandler(async(req,res)=>{
      const ProfileImageLocalPath=req.file?.path;

      if(!ProfileImageLocalPath)throw new ApiError(401,"profile picture required");

     const DelOldProfile= await FileDelete(req.user?.ProfilePublicId);

     if(!DelOldProfile)throw new ApiError(501,"Can not deleted Old Profile Picture");

      console.log("deleted Old Profile Picture");

     const NewProfilePic= await FileUpload(ProfileImageLocalPath);

     if(!NewProfilePic)throw new ApiError(501,"can not upload profile picture in cloudinary ")
     console.log("New Profile picture uploaded Succesfully ");

     const user=await User.findByIdAndUpdate(req.user?._id,
         {  
            $set:{
                ProfileImage:NewProfilePic.url,
                ProfilePublicId:NewProfilePic.public_id
                }
        },{
            new:true
        }
     ).select("-Password -RefreshToken");

     return res
     .status(201)
     .json(
        new ApiResponse(201,user,"profile pic updated succesfully! ")
     )
})


const UpdateCoverPic=AsynHandler(async(req,res)=>{
      const CoverImageLocalPath=req.file?.path;

      if(!CoverImageLocalPath)throw new ApiError(401,"Cover picture required");

     const DelOldCover= await FileDelete(req.user?.CoverPublicId);

     if(!DelOldCover)throw new ApiError(501,"Can not deleted Old Cover Picture");

      console.log("deleted Old Cover Picture");

     const NewCoverPic= await FileUpload(CoverImageLocalPath);

     if(!NewCoverPic)throw new ApiError(501,"can not upload Cover picture in cloudinary ")
     console.log("New Cover picture uploaded Succesfully ");

     const user=await User.findByIdAndUpdate(req.user?._id,
         {  
            $set:{
                 CoverImage:NewCoverPic.url,
                 CoverPublicId:NewCoverPic.public_id
                }
        },{
            new:true
        }
     ).select("-Password -RefreshToken");

     return res
     .status(201)
     .json(
        new ApiResponse(201,user,"Cover pic updated succesfully! ")
     )
})
export {
    Register,
    LogIn,
    LogOut,
    RenewAccesToken,
    ChangePassword,
    UpdateProfilePic,
    UpdateCoverPic
}