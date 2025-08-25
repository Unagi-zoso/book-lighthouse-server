import express, { Router } from 'express';
import fs from 'fs';

const router = Router();

// .well-known 폴더 생성
const wellKnownPath = '/tmp/.well-known/acme-challenge';
if (!fs.existsSync(wellKnownPath)) {
    fs.mkdirSync(wellKnownPath, { recursive: true });
}

// certbot 검증용 라우트
router.use('/.well-known', express.static('/tmp/.well-known'));

export default router;