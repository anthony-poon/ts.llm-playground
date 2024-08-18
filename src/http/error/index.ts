export class HTTPError extends Error {
  public readonly code: number;
  constructor(msg: string, code: number) {
    super(msg);
    this.code = code;
  }
}

export class NotFoundError extends HTTPError {
  constructor(msg: string = 'Not Found') {
    super(msg, 404);
  }
}

export class BadRequestError extends HTTPError {
  constructor(msg: string = 'Bad Request') {
    super(msg, 400);
  }
}

export class UnauthorizedError extends HTTPError {
  constructor(msg: string = 'Unauthorized') {
    super(msg, 401);
  }
}

export class ForbiddenError extends HTTPError {
  constructor(msg: string = 'Forbidden') {
    super(msg, 403);
  }
}

export class InternalError extends HTTPError {
  constructor(msg: string = 'Internal Error') {
    super(msg, 500);
  }
}
