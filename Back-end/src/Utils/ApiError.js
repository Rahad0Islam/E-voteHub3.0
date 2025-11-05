class ApiError extends Error{
    constructor(
        StatusCode,
        Message="Something went wrong",
        Errors=[],
        stack=""

    ) {
        super(Message);
        this.StatusCode=StatusCode;
        this.Message=Message;
        this.Errors=Errors;
        this.success=false;  
        this.data=null;

        if(stack)this.stack=stack;
        else {
            Error.captureStackTrace(this,this.constructor);
        }

    }
}

export{ApiError}