import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !secret) {
  throw new Error('QA seed requires SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY).')
}

const supabase = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
})

const IDS = {
  company: '00000000-0000-4000-8000-000000000101',
  property: '00000000-0000-4000-8000-000000000102',
  unit: '00000000-0000-4000-8000-000000000103',
  pricing: '00000000-0000-4000-8000-000000000104',
  workOrderWorker: '00000000-0000-4000-8000-000000000105',
  workOrderContractor: '00000000-0000-4000-8000-000000000106',
  jobWorker: '00000000-0000-4000-8000-000000000107',
  jobContractor: '00000000-0000-4000-8000-000000000108',
  assignmentWorker: '00000000-0000-4000-8000-000000000109',
  assignmentContractor: '00000000-0000-4000-8000-000000000110',
  lineWorker: '00000000-0000-4000-8000-000000000111',
  lineContractor: '00000000-0000-4000-8000-000000000112',
  photo: '00000000-0000-4000-8000-000000000113',
  document: '00000000-0000-4000-8000-000000000114',
  signoff: '00000000-0000-4000-8000-000000000115',
  paperwork: '00000000-0000-4000-8000-000000000116',
  payrollPeriod: '00000000-0000-4000-8000-000000000117',
  payrollItem: '00000000-0000-4000-8000-000000000118',
  payrollJobItem: '00000000-0000-4000-8000-000000000119',
}

const USERS = [
  { key: 'owner', email: 'qa-owner@eliteapartmentservices.test', password: 'QA-Only-2026!Owner', first_name: 'QA', last_name: 'Owner', role: 'owner' },
  { key: 'customer', email: 'qa-customer@eliteapartmentservices.test', password: 'QA-Only-2026!Customer', first_name: 'QA', last_name: 'Customer', role: 'apartment_company' },
  { key: 'worker', email: 'qa-worker@eliteapartmentservices.test', password: 'QA-Only-2026!Worker', first_name: 'QA', last_name: 'Worker', role: 'worker' },
  { key: 'contractor', email: 'qa-contractor@eliteapartmentservices.test', password: 'QA-Only-2026!Contractor', first_name: 'QA', last_name: 'Contractor', role: 'contractor' },
]

async function failIfError(label, result) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`)
  return result.data
}

async function getOrCreateUser(spec) {
  const listed = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listed.error) throw listed.error
  const existing = listed.data.users.find((user) => user.email?.toLowerCase() === spec.email.toLowerCase())
  if (existing) return existing
  const created = await supabase.auth.admin.createUser({
    email: spec.email,
    password: spec.password,
    email_confirm: true,
    user_metadata: { qa_only: true, role: spec.role },
  })
  if (created.error) throw created.error
  return created.data.user
}

async function main() {
  console.log('Creating/reusing QA-only Auth users...')
  const users = {}
  for (const spec of USERS) users[spec.key] = await getOrCreateUser(spec)

  await failIfError('apartment company', await supabase.from('apartment_companies').upsert({
    id: IDS.company,
    name: 'TEST — Elite QA Apartment Company',
    contact_name: 'QA Customer',
    phone: '210-555-0199',
    email: USERS.find((u) => u.key === 'customer').email,
    address: '100 QA Test Avenue',
    city: 'San Antonio',
    state: 'TX',
    zip: '78201',
    active: true,
  }, { onConflict: 'id' }))

  await failIfError('owner profile', await supabase.from('profiles').upsert({
    id: users.owner.id, first_name: 'QA', last_name: 'Owner', email: USERS[0].email, role: 'owner', active: true,
  }, { onConflict: 'id' }))

  await failIfError('customer profile', await supabase.from('profiles').upsert({
    id: users.customer.id, first_name: 'QA', last_name: 'Customer', email: USERS[1].email, role: 'apartment_company', active: true, apartment_company_id: IDS.company,
  }, { onConflict: 'id' }))

  await failIfError('worker profile', await supabase.from('profiles').upsert({
    id: users.worker.id, first_name: 'QA', last_name: 'Worker', email: USERS[2].email, role: 'worker', active: true,
  }, { onConflict: 'id' }))

  await failIfError('contractor profile', await supabase.from('profiles').upsert({
    id: users.contractor.id, first_name: 'QA', last_name: 'Contractor', email: USERS[3].email, role: 'contractor', active: true,
  }, { onConflict: 'id' }))

  await failIfError('property', await supabase.from('properties').upsert({
    id: IDS.property, property_type: 'apartment', apartment_company_id: IDS.company,
    name: 'TEST — QA Property', address: '200 QA Test Boulevard', city: 'San Antonio', state: 'TX', zip: '78202', active: true,
  }, { onConflict: 'id' }))

  await failIfError('unit', await supabase.from('units').upsert({
    id: IDS.unit, property_id: IDS.property, unit_number: 'TEST-101', bedrooms: 2, bathrooms: 2, square_feet: 1050, occupied: false,
  }, { onConflict: 'id' }))

  await failIfError('service pricing', await supabase.from('service_pricing').upsert({
    id: IDS.pricing, apartment_company_id: IDS.company, service_category: 'make_ready', pricing_type: 'flat', price: 325, active: true,
  }, { onConflict: 'id' }))

  const commonWorkOrder = {
    apartment_company_id: IDS.company, property_id: IDS.property, unit_id: IDS.unit,
    service_category: 'make_ready', priority: 'normal', requested_date: new Date().toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    property_name: 'TEST — QA Property', property_address: '200 QA Test Boulevard', city: 'San Antonio', state: 'TX', zip: '78202',
    service_area: 'Unit', unit_number: 'TEST-101', square_feet: 1050, bedrooms: '2', bathrooms: '2', occupancy: 'vacant', service: 'Make Ready',
    contact_name: 'QA Customer', contact_phone: '210-555-0199', access_method: 'lockbox', access_notes: 'TEST DATA ONLY',
    pricing_id: IDS.pricing, pricing_type: 'flat', unit_price: 325, pricing_quantity: 1, pricing_total: 325, is_estimate: false,
  }

  await failIfError('worker work order', await supabase.from('work_orders').upsert({
    ...commonWorkOrder, id: IDS.workOrderWorker, work_order_number: 900001, requested_by: users.customer.id,
    title: 'TEST — Worker Workflow', description: 'QA-only Work Order for worker workflow.', status: 'completed',
    submission_id: IDS.workOrderWorker,
  }, { onConflict: 'id' }))

  await failIfError('contractor work order', await supabase.from('work_orders').upsert({
    ...commonWorkOrder, id: IDS.workOrderContractor, work_order_number: 900002, requested_by: users.customer.id,
    title: 'TEST — Contractor Workflow', description: 'QA-only Work Order for contractor workflow.', status: 'in_progress',
    submission_id: IDS.workOrderContractor,
  }, { onConflict: 'id' }))

  await failIfError('worker row', await supabase.from('workers').upsert({
    id: users.worker.id, first_name: 'QA', last_name: 'Worker', phone: '210-555-0111', email: USERS[2].email,
    active: true, pay_type: 'hourly', pay_rate: 25,
  }, { onConflict: 'id' }))

  await failIfError('contractor row', await supabase.from('contractors').upsert({
    id: users.contractor.id, first_name: 'QA', last_name: 'Contractor', phone: '210-555-0222', email: USERS[3].email,
    specialty: 'Make Ready', active: true,
  }, { onConflict: 'id' }))

  await failIfError('worker job', await supabase.from('jobs').upsert({
    id: IDS.jobWorker, job_number: 990001, work_order_id: IDS.workOrderWorker, property_id: IDS.property, unit_id: IDS.unit,
    service_category: 'make_ready', title: 'TEST — Completed Worker Job', description: 'QA-only completed worker job.', assigned_by: users.owner.id,
    status: 'signed_off', scheduled_date: new Date().toISOString().slice(0, 10), due_date: new Date().toISOString().slice(0, 10),
    started_at: new Date(Date.now() - 3 * 3600000).toISOString(), completed_at: new Date(Date.now() - 3600000).toISOString(), total_amount: 350,
  }, { onConflict: 'id' }))

  await failIfError('contractor job', await supabase.from('jobs').upsert({
    id: IDS.jobContractor, job_number: 990002, work_order_id: IDS.workOrderContractor, property_id: IDS.property, unit_id: IDS.unit,
    service_category: 'make_ready', title: 'TEST — In Progress Contractor Job', description: 'QA-only in-progress contractor job.', assigned_by: users.owner.id,
    status: 'in_progress', scheduled_date: new Date().toISOString().slice(0, 10), due_date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    started_at: new Date(Date.now() - 3600000).toISOString(), total_amount: 325,
  }, { onConflict: 'id' }))

  await failIfError('worker assignment', await supabase.from('job_assignments').upsert({
    id: IDS.assignmentWorker, job_id: IDS.jobWorker, worker_id: users.worker.id, assigned_by: users.owner.id, status: 'completed',
    assigned_at: new Date(Date.now() - 4 * 3600000).toISOString(), accepted_at: new Date(Date.now() - 3.5 * 3600000).toISOString(), completed_at: new Date(Date.now() - 3600000).toISOString(), notes: 'TEST — worker completed QA workflow',
  }, { onConflict: 'id' }))

  await failIfError('contractor assignment', await supabase.from('job_assignments').upsert({
    id: IDS.assignmentContractor, job_id: IDS.jobContractor, contractor_id: users.contractor.id, assigned_by: users.owner.id, status: 'in_progress',
    assigned_at: new Date(Date.now() - 2 * 3600000).toISOString(), accepted_at: new Date(Date.now() - 90 * 60000).toISOString(), notes: 'TEST — contractor active QA workflow',
  }, { onConflict: 'id' }))

  await failIfError('worker line item', await supabase.from('job_line_items').upsert({
    id: IDS.lineWorker, job_id: IDS.jobWorker, pricing_item_id: null, description: 'TEST — Make Ready labor', quantity: 1, unit_price: 350, total_price: 350, notes: 'QA fixture',
  }, { onConflict: 'id' }))

  await failIfError('contractor line item', await supabase.from('job_line_items').upsert({
    id: IDS.lineContractor, job_id: IDS.jobContractor, pricing_item_id: null, description: 'TEST — Make Ready base service', quantity: 1, unit_price: 325, total_price: 325, notes: 'QA fixture',
  }, { onConflict: 'id' }))

  await failIfError('photo', await supabase.from('job_photos').upsert({
    id: IDS.photo, job_id: IDS.jobWorker, uploaded_by: users.worker.id, photo_type: 'after', storage_path: 'qa/test/worker-after.jpg', caption: 'TEST — completion photo reference',
  }, { onConflict: 'id' }))

  await failIfError('document', await supabase.from('job_documents').upsert({
    id: IDS.document, job_id: IDS.jobWorker, uploaded_by: users.worker.id, document_type: 'completion', storage_path: 'qa/test/completion.pdf', file_name: 'TEST-completion.pdf',
  }, { onConflict: 'id' }))

  await failIfError('signoff', await supabase.from('job_signoffs').upsert({
    id: IDS.signoff, job_id: IDS.jobWorker, representative_name: 'QA Property Manager', representative_title: 'QA Manager',
    signature_storage_path: 'qa/test/signoff.txt', signed_at: new Date(Date.now() - 45 * 60000).toISOString(), approved: true, notes: 'TEST — QA property signoff',
  }, { onConflict: 'id' }))

  await failIfError('paperwork', await supabase.from('paperwork_submissions').upsert({
    id: IDS.paperwork, job_id: IDS.jobWorker, worker_id: users.worker.id, paperwork_type: 'completion', storage_path: 'qa/test/worker-paperwork.pdf',
    submitted_at: new Date(Date.now() - 30 * 60000).toISOString(), approved_at: new Date(Date.now() - 15 * 60000).toISOString(), approved_by: users.owner.id, status: 'approved', notes: 'TEST — QA paperwork',
  }, { onConflict: 'id' }))

  await failIfError('payroll period', await supabase.from('payroll_periods').upsert({
    id: IDS.payrollPeriod, week_start: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10), week_end: new Date().toISOString().slice(0, 10),
    paperwork_deadline: new Date(Date.now() + 86400000).toISOString(), paycheck_pickup_time: new Date(Date.now() + 2 * 86400000).toISOString(), status: 'paid',
  }, { onConflict: 'id' }))

  await failIfError('payroll item', await supabase.from('payroll_items').upsert({
    id: IDS.payrollItem, payroll_period_id: IDS.payrollPeriod, worker_id: users.worker.id, gross_amount: 350, deductions: 35, net_amount: 315,
    check_number: 'TEST-990001', paid_at: new Date().toISOString(), notes: 'TEST — QA payroll only',
  }, { onConflict: 'id' }))

  await failIfError('payroll job item', await supabase.from('payroll_job_items').upsert({
    id: IDS.payrollJobItem, payroll_item_id: IDS.payrollItem, job_id: IDS.jobWorker, amount: 350,
  }, { onConflict: 'id' }))

  console.log('\nQA seed complete.')
  console.log('Customer:', USERS[1].email, '/', USERS[1].password)
  console.log('Worker:', USERS[2].email, '/', USERS[2].password)
  console.log('Contractor:', USERS[3].email, '/', USERS[3].password)
  console.log('Owner:', USERS[0].email, '/', USERS[0].password)
  console.log('All records are explicitly marked TEST/QA and use deterministic fixture IDs.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
