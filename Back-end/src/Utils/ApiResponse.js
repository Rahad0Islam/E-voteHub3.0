class ApiResponse{
    constructor(Statuscode,data,Message="Success"){
         this.Statuscode=Statuscode;
         this.data=data;
         this.Message=Message;
         this.Success=Statuscode<400;
    }
}
export {ApiResponse}