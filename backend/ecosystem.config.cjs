// ecosystem.config.js
module.exports = {
  apps : [{
    name: "agrifam-magang",
    script: "index.js", // Ganti dengan path entry point Anda
    env_file: ".env", // PM2 akan membaca file ini
    env_production: {
      NODE_ENV: "production",
    }
  }]
};
