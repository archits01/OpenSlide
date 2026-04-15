module.exports = {
  apps: [
    {
      name: "openslides-pdf",
      script: "server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "800M",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
  ],
};
