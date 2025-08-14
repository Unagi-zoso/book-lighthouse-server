#!/bin/bash
set -e

# 서버 배포 설정 스크립트 (PM2 기반)
# 사용법: ./deploy-setup.sh

echo "Setting up PM2 deployment environment..."

# 디렉터리 생성
sudo mkdir -p /opt/book-lighthouse-api
sudo mkdir -p /opt/book-lighthouse-api/logs

# PM2 글로벌 설치 확인
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# PM2 startup 설정 (안전한 방식)
echo "Setting up PM2 startup..."
echo "Running pm2 startup command..."
pm2 startup
echo ""
echo "IMPORTANT: Please copy and run the 'sudo env ...' command shown above."
echo "This is required for PM2 to start automatically on system boot."
echo ""
echo "After running the sudo command, you can proceed with deployment."

echo "Setup complete."
echo ""
echo "Commands to manage the application:"
echo "  pm2 start ecosystem.config.js --env production  # 앱 시작"
echo "  pm2 stop book-lighthouse-api                     # 앱 중지"
echo "  pm2 restart book-lighthouse-api                  # 앱 재시작"
echo "  pm2 reload book-lighthouse-api                   # 무중단 재시작"
echo "  pm2 status                                       # 상태 확인"
echo "  pm2 logs book-lighthouse-api                     # 로그 확인"
echo "  pm2 monit                                        # 실시간 모니터링"
echo ""
echo "After deployment, run: pm2 save"