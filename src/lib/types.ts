export interface CSRProgram {
  id: string
  user_id: string
  company_name: string
  budget_rupiah: number
  tasks_funded: number
  created_at: string
  focus_category?: string
  location?: string
  reward_type: string
  reward_value: number
  reward_points?: number
  start_date?: string
  end_date?: string
}

export interface ProgramRegistration {
  id: string
  user_id: string
  program_id: string
  registered_at: string
}

export interface User {
  id: string
  email: string
  role: string
  points: number
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  type: string
  status: string
  photo_url: string
  created_at: string
  company_name?: string
  location?: string
  description?: string
  reward_type?: string
  reward_value?: number
  users?: { email: string }
}
