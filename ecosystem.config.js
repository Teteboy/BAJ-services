module.exports = {
  apps: [
    {
      name: 'onfire-server',
      script: './dist/index.js',
      cwd: '/www/wwwroot/onfire.schemackozo.com/onfire.schemackozo.com/server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 5020,
      },
    },
  ],
};
