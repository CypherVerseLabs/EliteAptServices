alter table public.work_orders
add column if not exists pricing_id uuid references public.service_pricing(id);

alter table public.work_orders
add column if not exists pricing_type text;

alter table public.work_orders
add column if not exists unit_price numeric(12,2) not null default 0;

alter table public.work_orders
add column if not exists pricing_quantity numeric(12,2) not null default 1;

alter table public.work_orders
add column if not exists pricing_total numeric(12,2) not null default 0;

alter table public.work_orders
add column if not exists is_estimate boolean not null default false;
