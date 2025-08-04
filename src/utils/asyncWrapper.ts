import { Request, Response, NextFunction } from 'express';

// async 는 내부에서 예외 발생 시 reject 시킬 뿐 일반적인 예외처리가 불가
// 따라서 catch 를 덧붙이는 기능이 필요.

// Async wrapper to catch errors automatically
export const asyncWrapper = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
