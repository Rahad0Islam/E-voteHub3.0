import mongoose from "mongoose";

const EventSchema=new mongoose.Schema({
     Title:{
        type:String,
        trim:true,
        required:true
     },
     Description:{
        type:String,
     },
     BallotImage:
      [{
        url: { type: String, required: true },
        publicId: { type: String, required: true }
     }],
     UsedBallotImage:[{
        url: { type: String, required: true },
        publicId: { type: String, required: true }
     }],
     RegEndTime:{
         type: Date,
         required:true
     },
     VoteStartTime:{
        type: Date,
        required:true
     },
     VoteEndTime:{
        type: Date,
        required:true
     },

     ElectionType:{
        type:String,
        enum:["Single","Rank","MultiVote"],
        required:true
     },
     CreateBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
     }

},{timestamps:true});


export const VoteEvent= mongoose.model("VoteEvent",EventSchema);