import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const testPassword = process.env.LOCAL_TEST_PASSWORD
const allowedHosts = new Set(['127.0.0.1', 'localhost'])

if (!allowedHosts.has(new URL(supabaseUrl).hostname)) {
  throw new Error('Test users can only be created against a localhost Supabase instance.')
}

if (!serviceRoleKey || !testPassword) {
  throw new Error('Set SUPABASE_SERVICE_ROLE_KEY and LOCAL_TEST_PASSWORD in the process environment.')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)
const testUsers = [
  { email: 'principal@school.local', role: 'principal' },
  { email: 'numeracy@school.local', role: 'numeracy' },
  { email: 'literacy@school.local', role: 'literacy' },
  { email: 'jam@school.local', role: 'just_a_minute' },
  { email: 'invalid@school.local', role: 'invalid_role' },
]

async function createOrUpdateTestUsers() {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) {
    throw new Error(`Unable to list local Auth users: ${error.message}`)
  }

  for (const testUser of testUsers) {
    const existingUser = data.users.find((user) => user.email === testUser.email)
    const result = existingUser
      ? await supabase.auth.admin.updateUserById(existingUser.id, {
          app_metadata: { role: testUser.role },
        })
      : await supabase.auth.admin.createUser({
          email: testUser.email,
          password: testPassword,
          email_confirm: true,
          app_metadata: { role: testUser.role },
        })

    if (result.error) {
      throw new Error(`Unable to prepare a local test account: ${result.error.message}`)
    }
  }

  console.log('Local test accounts are ready. Their password is not printed.')
}

createOrUpdateTestUsers().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
