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
  console.log("--- Inspecting 'users' ---")
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .limit(1)
  if (userError) {
    console.error('Error fetching users:', userError)
  } else {
    console.log('User sample:', userData)
  }

  console.log("--- Inspecting 'tasks' ---")
  const { data: taskData, error: taskError } = await supabase
    .from('tasks')
    .select('*')
    .limit(1)
  if (taskError) {
    console.error('Error fetching tasks:', taskError)
  } else {
    console.log('Task sample:', taskData)
  }
}

main()
