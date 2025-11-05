import { Router } from "express";
import { upload } from "../Middleware/Multer.Middleware.js";
import { jwtVerification } from "../Middleware/Authentication.Middleware.js";
import { CountingVote, CreateVoteEvent, GetAllBallotImage,
     GetApprovedNominee, GetAvailableBallotImage, GetPendingNominee,
      GetUsedBallotImage, GetVoter, getVoterPerticipate,
       GivenVote, NomineeApproved, NomineeRegister, VoterRegister, ListEvents, GetUserVoteStatus, GetVoterRegStatus, GetNomineeRegStatus } from "../Controllers/VoteEvent.controller.js";
const router=Router();

router.route("/VoteEvent").post(jwtVerification,
     
    upload.fields([
       {
           name:"BallotImage",
           maxCount:10
       }
    ]),
    
    CreateVoteEvent)

router.route("/events").get(jwtVerification, ListEvents);
router.route("/voteStatus").get(jwtVerification, GetUserVoteStatus);
router.route("/voterRegStatus").get(jwtVerification, GetVoterRegStatus);
router.route("/nomineeRegStatus").get(jwtVerification, GetNomineeRegStatus);

router.route("/nomineReg").post(jwtVerification,NomineeRegister)
router.route("/voterReg").post(jwtVerification,VoterRegister)
router.route("/voting").post(jwtVerification,GivenVote)
router.route("/countvote").get(jwtVerification,CountingVote);
router.route("/nomineeApproval").post(jwtVerification,NomineeApproved)
router.route("/getallballot").get(jwtVerification,GetAllBallotImage)
router.route("/getAvailableBallot").get(jwtVerification,GetAvailableBallotImage);
router.route("/getUsedBallot").get(jwtVerification,GetUsedBallotImage);
router.route("/getApproveNominee").get(jwtVerification,GetApprovedNominee)
router.route("/getPendingNominee").get(jwtVerification,GetPendingNominee)
router.route("/getVoterDetails").get(jwtVerification,GetVoter)
router.route("/getVoterPerticipate").get(jwtVerification,getVoterPerticipate)


export default router;