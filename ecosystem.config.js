const { cwd } = require('process')

module.exports = {
  apps: [
    // {
    //   name: 'next',
    //   script: 'node_modules/next/dist/bin/next',
    //   args: 'start',
    //   interpreter: 'none',
    //   env: {
    //     NODE_ENV: 'development'
    //   }
    // }
    {
      name: 'worker',
      script: 'summarizer.js', // Replace with the entry point of your worker file
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
}
