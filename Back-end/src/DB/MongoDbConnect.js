import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const MongoDbConnect=(async()=>{
     try {
        console.log(DB_NAME);
        const Connected = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)

        console.log("MongoDB connected successfully !   ",Connected.connection.host);

     } catch (error) {
        console.log("Mongodb connection failed ",error.message);
        process.exit(1);  //immediately terminates the Node.js   || if i use
        //  return; its terminate only this current function ... exit(1)  means whole programm stopped
        
     }
})

export default MongoDbConnect;