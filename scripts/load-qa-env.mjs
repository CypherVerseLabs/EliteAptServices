import { loadEnvFile } from 'node:process'

// Load local QA secrets before standalone scripts read process.env.
// .env.local is loaded first so it takes precedence over .env.
loadEnvFile('.env.local')
loadEnvFile('.env')
