import {v2 as cloudinary}from 'cloudinary'
import fs from 'fs'
import { ApiError } from './ApiError.js';
import dotenv from 'dotenv'
dotenv.config()


cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.API_KEY,
    api_secret:process.env.API_SECRET
});



const FileUpload=async(LocalFilePath)=>{

   try {
     if(!LocalFilePath)return null;
     console.log("rahad  ",LocalFilePath);

     const UploadResponse=await cloudinary.uploader.upload(LocalFilePath,{
        resource_type:"auto"
     })
     
     console.log("File is uploaded succesfully ",UploadResponse.url);
     fs.unlinkSync(LocalFilePath);
     return UploadResponse; 

   } catch (error) {
       fs.unlinkSync(LocalFilePath);
       return null;
   }
   
}



const FileDelete=async(Public_id)=>{
    try {
    if(!Public_id)return null;
       const Response=await cloudinary.uploader.destroy(Public_id);
        console.log("File delete Succesfully");
        return Response;

    } catch (error) {
        throw new ApiError(501,"File can not deleted");
    }
}



export {FileUpload,FileDelete}