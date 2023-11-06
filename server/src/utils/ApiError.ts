class ApiError extends Error {
  statusCode: Number;
  data?: any;
  success: Boolean;
  errors?: any;

  constructor(
    message: any = "Something went wrong...",
    statusCode: Number,
    errors: any = [],
    stack?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

class ErrorHandler extends Error {
  statusCode: Number;

  constructor(message: any, statusCode: Number) {
    super(message);
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

export { 
   ApiError, 
   ErrorHandler 
};
