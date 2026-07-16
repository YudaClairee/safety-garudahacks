import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '../../lib/supabase';

export const Route = createFileRoute('/api/trigger-automation')({
  server: {
    handlers: {
      GET: async () => {
        return handleAutomation();
      },
      POST: async () => {
        return handleAutomation();
      },
    },
  },
});

async function handleAutomation() {
  try {
    // 1. Fetch pending tasks
    const { data: pendingTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'pending');

    if (tasksError) {
      return new Response(JSON.stringify({ error: 'Error fetching pending tasks', details: tasksError }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!pendingTasks || pendingTasks.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending tasks found', processedCount: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const processedTasks = [];
    const errors = [];

    // 2. Process each pending task
    for (const task of pendingTasks) {
      try {
        // A. Fetch current user points
        const { data: userData, error: userFetchError } = await supabase
          .from('users')
          .select('points')
          .eq('id', task.user_id)
          .single();

        if (userFetchError) throw new Error(`User fetch failed: ${userFetchError.message}`);

        const currentPoints = userData?.points || 0;
        const newPoints = currentPoints + 1000; // 1,000 Poin Kebaikan flat reward

        // B. Fetch first active program
        const { data: programsData, error: programFetchError } = await supabase
          .from('csr_programs')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(1);

        if (programFetchError || !programsData || programsData.length === 0) {
          throw new Error('No CSR program available to fund this task.');
        }

        const targetProgram = programsData[0];
        const newBudget = Number(targetProgram.budget_rupiah) - 250000; // Rp 250.000 deduction
        const newTasksFunded = (targetProgram.tasks_funded || 0) + 1;

        if (newBudget < 0) {
          throw new Error(`Insufficient budget in program: ${targetProgram.company_name}`);
        }

        // C. Update Database (User Points, CSR Program, and Task Status)
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({ points: newPoints })
          .eq('id', task.user_id);

        if (userUpdateError) throw new Error(`User points update failed: ${userUpdateError.message}`);

        const { error: programUpdateError } = await supabase
          .from('csr_programs')
          .update({
            budget_rupiah: newBudget,
            tasks_funded: newTasksFunded
          })
          .eq('id', targetProgram.id);

        if (programUpdateError) throw new Error(`CSR Program update failed: ${programUpdateError.message}`);

        const { error: taskUpdateError } = await supabase
          .from('tasks')
          .update({ status: 'approved' })
          .eq('id', task.id);

        if (taskUpdateError) throw new Error(`Task status update failed: ${taskUpdateError.message}`);

        processedTasks.push({
          taskId: task.id,
          citizenId: task.user_id,
          taskType: task.type,
          pointsAwarded: 1000,
          fundedBy: targetProgram.company_name,
          deductedAmount: 250000
        });
      } catch (err: any) {
        console.error(`Error processing task ${task.id}:`, err);
        errors.push({ taskId: task.id, error: err.message });
      }
    }

    return new Response(JSON.stringify({
      message: 'Automation execution completed',
      processedCount: processedTasks.length,
      processedDetails: processedTasks,
      failedCount: errors.length,
      failedDetails: errors
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Unhandled webhook error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
