import mongoose from "mongoose";

const NomineeSchema= mongoose.Schema({
    UserID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User", 
        required:true 
    },
    EventID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"VoteEvent",
        required:true
    },
    Approved:{
        type:Boolean,
        default:false
    },
    SelectedBalot:{
         url: { type: String, required: true },
         publicId: { type: String, required: true }
    },

    Description:{
        type:String
    }

},{ timestamps: true });

export const NomineeReg=mongoose.model("NomineeReg",NomineeSchema);