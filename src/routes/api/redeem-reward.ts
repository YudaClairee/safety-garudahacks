import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const Route = createFileRoute('/api/redeem-reward')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => null)
          const rewardName = String(body?.rewardName || '')
          const rewardType = String(body?.rewardType || '')
          const rewardValue = Number(body?.rewardValue || 0)
          const pointsCost = Number(body?.pointsCost || 0)

          if (!rewardName || !rewardType || !rewardValue || !pointsCost) {
            return new Response(
              JSON.stringify({ error: 'Data redeem tidak lengkap' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } },
            )
          }

          const authHeader = request.headers.get('Authorization')
          let token = ''
          if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7)
          }

          if (!token) {
            return new Response(
              JSON.stringify({ error: 'Anda belum login (Token tidak ditemukan)' }),
              { status: 401, headers: { 'Content-Type': 'application/json' } },
            )
          }

          const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
              headers: {
                Authorization: `Bearer ${token}`
              }
            },
            auth: {
              persistSession: false
            }
          })

          const { data: { user }, error: authError } = await userSupabase.auth.getUser(token)
          if (authError || !user) {
            return new Response(
              JSON.stringify({ error: 'Sesi login tidak valid atau kedaluwarsa' }),
              { status: 401, headers: { 'Content-Type': 'application/json' } },
            )
          }

          const { data: userData, error: userError } = await userSupabase
            .from('users')
            .select('points')
            .eq('id', user.id)
            .single()

          if (userError) {
            return new Response(
              JSON.stringify({ error: userError.message }),
              { status: 500, headers: { 'Content-Type': 'application/json' } },
            )
          }

          const currentPoints = Number(userData?.points || 0)
          if (currentPoints < pointsCost) {
            return new Response(
              JSON.stringify({ error: 'Saldo Safety Net tidak cukup' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } },
            )
          }

          const voucherCode = `JLN-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`

          const { error: updateError } = await userSupabase
            .from('users')
            .update({ points: currentPoints - pointsCost })
            .eq('id', user.id)

          if (updateError) {
            return new Response(
              JSON.stringify({ error: updateError.message }),
              { status: 500, headers: { 'Content-Type': 'application/json' } },
            )
          }

          const { error: insertError } = await userSupabase
            .from('reward_redemptions')
            .insert({
              user_id: user.id,
              reward_name: rewardName,
              reward_type: rewardType,
              reward_value: rewardValue,
              points_cost: pointsCost,
              voucher_code: voucherCode,
              status: 'issued',
            })

          if (insertError) {
            return new Response(
              JSON.stringify({ error: insertError.message }),
              { status: 500, headers: { 'Content-Type': 'application/json' } },
            )
          }

          return new Response(
            JSON.stringify({
              message: 'Redeem berhasil diproses',
              voucherCode,
              remainingPoints: currentPoints - pointsCost,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        } catch (err: any) {
          return new Response(
            JSON.stringify({ error: err?.message || 'Internal Server Error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          )
        }
      },
    },
  },
})
