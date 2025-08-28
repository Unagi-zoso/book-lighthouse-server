# book-lighthouse-server
책바다 서비스를 최소비용으로 이용할 수 있게 도서관 집합을 알려주는 서비스 '책등대'의 서버 코드

## 실행 관련
현 프로젝트를 구동하기 위해선 아래와 같은 환경변수가 필요합니다.
정상적인 구동을 위해 production에서 실행을 권장합니다.

```
LIBRARY_API_KEY       // 정보나루 API KEY
LIBRARY_API_BASE_URL  // 정보나루 API 기본 URL
NL_API_KEY            // 국립중앙도서관 API KEY
SUPABASE_URL          // SUPABASE URL
SUPABASE_ANON_KEY     // SUPABASE 익명 KEY
PORT                  // 기본 HTTP 포트
CORS_ORIGIN           // CORS 허용 오리진
env                   // 서버 구동 환경 (production, development)
NODE_ENV              // env 와 같은 역할을 하지만 레거시적으로 중복된 변수
SSL_CERT_PATH         // SSL 인증서 경로
SSL_KEY_PATH          // SSL KEY 경로
HTTPS_PORT            // HHTPS 포트
```

package.json 의 의존성을 설치합니다.

PM2를 이용해 Nodejs 서버를 구동합니다.

## 프로젝트명 변경
현 프로젝트 '책등대'는 북테크, 책바닷가 등의 이름을 거쳐 지어진 이름입니다. 
따라서 bookshore 같은 이름이 아직 남아있을 수 있습니다.

## 의존성
주로 MIT, Apache-2.0, ISC, BSD 계열로 상업적 이용을 허용.

```
"dependencies": {
    "@supabase/supabase-js": "^2.53.0",
    "axios": "^1.11.0",
    "compression": "^1.7.4",
    "dotenv": "^16.4.5",
    "express": "^4.21.2",
    "helmet": "^8.0.0",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "@types/compression": "^1.7.5",
    "@types/express": "^5.0.3",
    "@types/jest": "^30.0.0",
    "@types/node": "^24.1.0",
    "@types/supertest": "^6.0.3",
    "@types/uuid": "^10.0.0",
    "eslint": "^9.16.0",
    "jest": "^30.0.5",
    "nodemon": "^3.1.10",
    "prettier": "^3.4.2",
    "rimraf": "^6.0.1",
    "supertest": "^7.1.4",
    "ts-jest": "^29.4.1",
    "ts-node": "^10.9.2",
    "tsc-alias": "^1.8.16",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.9.2"
  }
  ```

## 사용 API
```
국립중앙도서관 API(ISBN 서지검색) - 도서 검색
도서관 정보나루 API(도서 소장 도서관 검색) - 도서 소장 도서관 검색
```

## 그 외
일부 소스코드는 Claude를 통해 생성되었습니다.
