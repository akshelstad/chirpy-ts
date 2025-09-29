// 400
export class BadRequestError extends Error {
  code: number = 400;
  constructor(message: string) {
    super(message);
  }
}

// 401
export class UnauthorizedError extends Error {
  code: number = 401;
  constructor(message: string) {
    super(message);
  }
}

// 403
export class ForbiddenError extends Error {
  code: number = 403;
  constructor(message: string) {
    super(message);
  }
}

// 404
export class NotFoundError extends Error {
  code: number = 404;
  constructor(message: string) {
    super(message);
  }
}

// 500
export class InternalServerError extends Error {
  code: number = 500;
  constructor(message: string) {
    super(message);
  }
}
