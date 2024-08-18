// to make the file a module and avoid the TypeScript error
export {};

declare module 'express' {
  interface Request {
  }
}
