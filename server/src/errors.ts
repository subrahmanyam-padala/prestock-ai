export class HttpError extends Error {
  constructor(message: string, public status = 500, public code = 'internal_error') {
    super(message);
  }
}
