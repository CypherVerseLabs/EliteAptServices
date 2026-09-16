import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !secret) throw new Error('QA cleanup requires SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY).')

const supabase = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } })
const emails = new Set([
  'qa-owner@eliteapartmentservices.test',
  'qa-customer@eliteapartmentservices.test',
  'qa-worker@eliteapartmentservices.test',
  'qa-contractor@eliteapartmentservices.test',
])
const companyId = '00000000-0000-4000-8000-000000000101'
const ids = {
  property: '00000000-0000-4000-8000-000000000102', unit: '00000000-0000-4000-8000-000000000103', pricing: '00000000-0000-4000-8000-000000000104',
  workOrders: ['00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000000106'],
  jobs: ['00000000-0000-4000-8000-000000000107', '00000000-0000-4000-8000-000000000108'],
  assignments: ['00000000-0000-4000-8000-000000000109', '00000000-0000-4000-8000-000000000110'],
  lineItems: ['00000000-0000-4000-8000-000000000111', '00000000-0000-4000-8000-000000000112'],
  photo: '00000000-0000-4000-8000-000000000113', document: '00000000-0000-4000-8000-000000000114', signoff: '00000000-0000-4000-8000-000000000115', paperwork: '00000000-0000-4000-8000-000000000116',
  payrollPeriod: '00000000-0000-4000-8000-000000000117', payrollItem: '00000000-0000-4000-8000-000000000118', payrollJobItem: '00000000-0000-4000-8000-000000000119',
}

async function remove(table, column, values) {
  for (const value of values) {
    const { error } = await supabase.from(table).delete().eq(column, value)
    if (error) throw new Error(`${table}: ${error.message}`)
  }
}

async function main() {
  await remove('payroll_job_items', 'id', [ids.payrollJobItem])
  await remove('payroll_items', 'id', [ids.payrollItem])
  await remove('payroll_periods', 'id', [ids.payrollPeriod])
  await remove('paperwork_submissions', 'id', [ids.paperwork])
  await remove('job_signoffs', 'id', [ids.signoff])
  await remove('job_documents', 'id', [ids.document])
  await remove('job_photos', 'id', [ids.photo])
  await remove('job_line_items', 'id', ids.lineItems)
  await remove('job_assignments', 'id', ids.assignments)
  await remove('jobs', 'id', ids.jobs)
  await remove('work_orders', 'id', ids.workOrders)
  await remove('service_pricing', 'id', [ids.pricing])
  await remove('units', 'id', [ids.unit])
  await remove('properties', 'id', [ids.property])
  await remove('apartment_companies', 'id', [companyId])

  const listed = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listed.error) throw listed.error
  for (const user of listed.data.users.filter((u) => emails.has((u.email || '').toLowerCase()))) {
    const { error } = await supabase.auth.admin.deleteUser(user.id)
    if (error) throw new Error(`auth user ${user.email}: ${error.message}`)
  }
  console.log('QA fixture cleanup complete.')
}

main().catch((error) => { console.error(error); process.exit(1) })
