const { CronJob } = require('cron')

// new CronJob(
//   '*/2 * * * *',
//   async function () {
//     const res = await fetch('http://localhost:3000/api/testRes')
//     if (res.ok) {
//       console.log('GETTING SUCCESS!')
//     }
//   },
//   null,
//   true,
//   'America/Los_Angeles'
// )

new CronJob(
  '0 */2 * * *',
  async function () {
    const res = await fetch('http://localhost:3000/api/email')
    if (res.ok) {
      console.log('GETTING SUCCESS!')
    }
  },
  null,
  true,
  'America/Los_Angeles'
)
