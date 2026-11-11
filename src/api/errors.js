export class ApiError extends Error {
  constructor(message, status = 0, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
