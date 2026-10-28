/** An error we throw on purpose. The error handler turns it into an HTTP response. */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }

  static badRequest(message: string): AppError {
    return new AppError(400, message);
  }
  static unauthorized(message = "Authentication required"): AppError {
    return new AppError(401, message);
  }
  static forbidden(message = "You do not have permission to do this"): AppError {
    return new AppError(403, message);
  }
  static notFound(message = "Resource not found"): AppError {
    return new AppError(404, message);
  }
  static conflict(message: string): AppError {
    return new AppError(409, message);
  }
}
