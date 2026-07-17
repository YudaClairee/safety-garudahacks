import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.resolve(process.cwd(), '.env')
let env = ''
try {
  env = fs.readFileSync(envPath, 'utf8')
} catch (e) {
  try {
    env = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8')
  } catch (e2) {
    console.error('No .env found')
    process.exit(1)
  }
}

let SUPABASE_URL = ''
let SUPABASE_ANON_KEY = ''

env.split('\n').forEach((line) => {
  if (line.startsWith('VITE_SUPABASE_URL='))
    SUPABASE_URL = line.split('=')[1].trim()
  if (line.startsWith('VITE_SUPABASE_ANON_KEY='))
    SUPABASE_ANON_KEY = line.split('=')[1].trim()
})

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function main() {
  const email = `relawan.${Math.floor(Math.random() * 100000)}@jalan.org`
  const password = 'PasswordSuperS123!'

  console.log(`1. Signing up citizen account: ${email}`)
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (signUpError) {
    console.error('Sign up failed:', signUpError)
    process.exit(1)
  }

  const userId = signUpData.user?.id
  console.log(`   Account created. User ID: ${userId}`)

  console.log(`1.5. Signing in with the new account to establish session...`)
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    })

  if (signInError) {
    console.error('Sign in failed:', signInError)
    process.exit(1)
  }

  // Wait a moment for trigger execution
  await new Promise((r) => setTimeout(r, 2000))

  // Verify user profile is created
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError) {
    console.error('Failed to fetch created user profile:', profileError)
    process.exit(1)
  }
  console.log('   User profile in DB:', userProfile)

  // 2. Insert dummy task
  console.log('2. Inserting a pending task...')
  const { data: taskData, error: taskError } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      type: 'Membersihkan Lingkungan',
      status: 'pending',
      photo_url:
        'https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&q=80&w=400',
    })
    .select()

  if (taskError) {
    console.error('Failed to insert task:', taskError)
    process.exit(1)
  }
  console.log('   Inserted task details:', taskData[0])

  // Fetch initial budget
  const { data: initialProgram } = await supabase
    .from('csr_programs')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
  console.log('   Initial CSR Program state:', initialProgram[0])

  // 3. Trigger API Webhook
  console.log(
    '3. Triggering webhook at http://localhost:3000/api/trigger-automation...',
  )
  try {
    const res = await fetch('http://localhost:3000/api/trigger-automation')
    const json = await res.json()
    console.log('   Webhook Response:', JSON.stringify(json, null, 2))
  } catch (err) {
    console.error('   Failed to contact webhook server:', err)
    process.exit(1)
  }

  // 4. Verify updates
  console.log('4. Verifying database changes...')

  const { data: updatedTask } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskData[0].id)
    .single()
  console.log('   Updated Task Status:', updatedTask.status) // Should be approved

  const { data: updatedProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  console.log('   Updated User Points:', updatedProfile.points) // Should be 1000

  const { data: updatedProgram } = await supabase
    .from('csr_programs')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
  console.log('   Updated CSR Program state:', updatedProgram[0]) // Budget should be minus 250,000, tasks_funded should be +1
}

main()
