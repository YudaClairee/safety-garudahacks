export interface CSRProgram {
  id: string
  company_name: string
  budget_rupiah: number
  tasks_funded: number
  created_at: string
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
  users?: { email: string }
}
