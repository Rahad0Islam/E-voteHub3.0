import mongoose from "mongoose";

const VoteCountSchema= new mongoose.Schema({
     VoterID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
     },
     EventID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"VoteEvent"
     },

    ElectionType:{
        type:String,
        enum:["Single","Rank","MultiVote"],
        required:true
     },
    
     SelectedNominee:[{
        NomineeId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        Rank:{
            type:Number
        }
     }]
    



    


},{timestamps:true})


export const VoteCount=mongoose.model("VoteCount",VoteCountSchema);