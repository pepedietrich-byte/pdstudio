// PM2 Ecosystem Config — PDSTUDIO Runner
// Start:  pm2 start ecosystem.config.cjs
// Reload: pm2 reload pdstudio-runner
// Logs:   pm2 logs pdstudio-runner

module.exports = {
  apps: [
    {
      name:             'pdstudio-runner',
      script:           'server.js',
      cwd:              '/opt/pdstudio-runner',
      interpreter:      'node',

      // Load .env from runner directory
      // PM2 does not natively support env_file for ESM — dotenv/config handles it in server.js
      env: {
        NODE_ENV: 'production',
      },

      // Single instance — runner uses a lock to prevent concurrent builds
      instances:        1,
      exec_mode:        'fork',

      // Auto-restart on crash
      autorestart:      true,
      restart_delay:    3000,
      max_restarts:     10,

      // Do NOT watch files — runner.sh edits the repo and we don't want restarts
      watch:            false,

      // Restart if memory exceeds 512MB
      max_memory_restart: '512M',

      // Logs
      error_file:       '/opt/pdstudio-runner/logs/pm2-error.log',
      out_file:         '/opt/pdstudio-runner/logs/pm2-out.log',
      log_date_format:  'YYYY-MM-DD HH:mm:ss Z',
      merge_logs:       true,
      time:             true,
    },
  ],
}
