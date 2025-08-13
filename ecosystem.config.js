module.exports = {
  apps: [{
    name: 'book-lighthouse-api',
    script: 'dist/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      HOST: '0.0.0.0'
    },
    error_file: '/var/log/book-lighthouse/err.log',
    out_file: '/var/log/book-lighthouse/out.log',
    log_file: '/var/log/book-lighthouse/combined.log',
    time: true
  }]
};