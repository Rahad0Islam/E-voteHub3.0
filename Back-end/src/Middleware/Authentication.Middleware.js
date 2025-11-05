import { User } from "../Models/User.Model.js";
import { ApiError } from "../Utils/ApiError.js";
import { AsynHandler } from "../Utils/AsyncHandler.js";
import jwt from 'jsonwebtoken'

const jwtVerification=AsynHandler(async(req,res,next)=>{
   try {
     // Prefer cookie, but also support Authorization: Bearer <token>
     let Token = req.cookies?.AccessToken;
     const authHeader = req.header("Authorization");
     if(!Token && authHeader){
       const parts = authHeader.split(' ');
       if(parts.length === 2 && /^Bearer$/i.test(parts[0])){
         Token = parts[1].trim();
       }
     }
 
     if(!Token)throw new ApiError(401,"Authentication error! ");
     
     const DecodeToken=jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET);
     const user=await User.findById(DecodeToken?._id).select("-Password -RefreshToken")
 
 
     if(!user)throw new ApiError(401,"Invalid access token !")
     req.user=user;
      next()
   } catch (error) {
     throw new ApiError(401,"Invalid access token !")
   }

})


export{jwtVerification}