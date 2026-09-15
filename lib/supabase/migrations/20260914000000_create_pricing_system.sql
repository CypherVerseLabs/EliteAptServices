-- ============================================================
-- ELITE APARTMENT SERVICES
-- PRICING SYSTEM
-- ============================================================
--
-- Supports:
--   - Multiple price lists
--   - Pricing categories
--   - Company abbreviations
--   - Flat pricing
--   - Per-square-foot pricing
--   - Per-wall pricing
--   - Per-room pricing
--   - Per-unit pricing
--   - Per-item pricing
--   - Estimate-based services
--   - Historical pricing
--   - Active/inactive services
--
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- PRICE LISTS
-- ============================================================

create table if not exists public.price_lists (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  description text,

  active boolean not null default true,

  effective_date date not null default current_date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint price_lists_name_check
    check (length(trim(name)) > 0)
);

create index if not exists price_lists_active_idx
  on public.price_lists(active);

create index if not exists price_lists_effective_date_idx
  on public.price_lists(effective_date desc);


-- ============================================================
-- PRICING CATEGORIES
-- ============================================================

create table if not exists public.pricing_categories (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  description text,

  sort_order integer not null default 0,

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint pricing_categories_name_check
    check (length(trim(name)) > 0)
);

create unique index if not exists pricing_categories_name_unique_idx
  on public.pricing_categories(lower(name));

create index if not exists pricing_categories_sort_idx
  on public.pricing_categories(sort_order);


-- ============================================================
-- PRICING ITEMS
-- ============================================================

create table if not exists public.pricing_items (
  id uuid primary key default gen_random_uuid(),

  price_list_id uuid not null
    references public.price_lists(id)
    on delete restrict,

  category_id uuid not null
    references public.pricing_categories(id)
    on delete restrict,

  name text not null,

  abbreviation text,

  description text,

  pricing_type text not null default 'flat',

  unit text,

  price numeric(12,2) not null default 0,

  minimum_quantity numeric(12,2),

  maximum_quantity numeric(12,2),

  active boolean not null default true,

  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint pricing_items_name_check
    check (length(trim(name)) > 0),

  constraint pricing_items_price_check
    check (price >= 0),

  constraint pricing_items_pricing_type_check
    check (
      pricing_type in (
        'flat',
        'per_sq_ft',
        'per_wall',
        'per_room',
        'per_unit',
        'per_item',
        'per_area',
        'per_estimate'
      )
    ),

  constraint pricing_items_quantity_check
    check (
      minimum_quantity is null
      or maximum_quantity is null
      or minimum_quantity <= maximum_quantity
    )
);

create index if not exists pricing_items_price_list_idx
  on public.pricing_items(price_list_id);

create index if not exists pricing_items_category_idx
  on public.pricing_items(category_id);

create index if not exists pricing_items_active_idx
  on public.pricing_items(active);

create index if not exists pricing_items_abbreviation_idx
  on public.pricing_items(lower(abbreviation));


-- ============================================================
-- PRICE LIST / ITEM UNIQUENESS
-- ============================================================

create unique index if not exists pricing_items_unique_name_idx
  on public.pricing_items(
    price_list_id,
    category_id,
    lower(name)
  );


-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists price_lists_set_updated_at
  on public.price_lists;

create trigger price_lists_set_updated_at
before update on public.price_lists
for each row
execute function public.set_updated_at();


drop trigger if exists pricing_categories_set_updated_at
  on public.pricing_categories;

create trigger pricing_categories_set_updated_at
before update on public.pricing_categories
for each row
execute function public.set_updated_at();


drop trigger if exists pricing_items_set_updated_at
  on public.pricing_items;

create trigger pricing_items_set_updated_at
before update on public.pricing_items
for each row
execute function public.set_updated_at();


-- ============================================================
-- SEED PRICE LISTS
-- ============================================================

insert into public.price_lists (
  name,
  description,
  effective_date
)
select
  'Basic Make Ready',
  'Elite Apartment Services basic make-ready pricing.',
  current_date
where not exists (
  select 1
  from public.price_lists
  where lower(name) = lower('Basic Make Ready')
);


insert into public.price_lists (
  name,
  description,
  effective_date
)
select
  'Painter Price List',
  'Elite Apartment Services detailed painter pricing.',
  current_date
where not exists (
  select 1
  from public.price_lists
  where lower(name) = lower('Painter Price List')
);


insert into public.price_lists (
  name,
  description,
  effective_date
)
select
  'Multi-Service Price List',
  'Elite Apartment Services painting, sheetrock, carpet, housekeeping, resurfacing, and ceramic tile pricing.',
  current_date
where not exists (
  select 1
  from public.price_lists
  where lower(name) = lower('Multi-Service Price List')
);


-- ============================================================
-- SEED CATEGORIES
-- ============================================================

insert into public.pricing_categories (name, description, sort_order)
select *
from (
  values
    ('Make Ready', 'Basic make-ready unit pricing.', 10),
    ('Make Ready Add-ons', 'Additional make-ready repairs and services.', 20),
    ('Painting', 'Painting services and painting rates.', 30),
    ('Painting Abbreviations', 'Internal Elite painting abbreviations.', 40),
    ('Cabinets', 'Kitchen and bathroom cabinet services.', 50),
    ('Sheetrock', 'Sheetrock replacement and repair.', 60),
    ('Tape / Float / Texture', 'Tape, float and texture services.', 70),
    ('Carpet Cleaning', 'Carpet cleaning and related services.', 80),
    ('Housekeeping', 'Apartment and common-area cleaning.', 90),
    ('Resurfacing', 'Kitchen and bathroom resurfacing.', 100),
    ('Ceramic Tile', 'Ceramic tile installation and repair.', 110),
    ('Miscellaneous', 'Other services and charges.', 120)
) as seed(name, description, sort_order)
where not exists (
  select 1
  from public.pricing_categories c
  where lower(c.name) = lower(seed.name)
);


-- ============================================================
-- BASIC MAKE READY PRICING
-- ============================================================

insert into public.pricing_items (
  price_list_id,
  category_id,
  name,
  abbreviation,
  description,
  pricing_type,
  unit,
  price,
  sort_order
)
select
  pl.id,
  c.id,
  seed.name,
  null,
  seed.description,
  seed.pricing_type,
  seed.unit,
  seed.price,
  seed.sort_order
from (
  values
    ('1 Bedroom Make Ready', 'Basic 1 bedroom make ready.', 'per_unit', 'unit', 175.00, 10),
    ('2 Bedroom Make Ready', 'Basic 2 bedroom make ready.', 'per_unit', 'unit', 205.00, 20),
    ('3 Bedroom Make Ready', 'Basic 3 bedroom make ready.', 'per_unit', 'unit', 235.00, 30),
    ('4 Bedroom Make Ready', 'Basic 4 bedroom make ready.', 'per_unit', 'unit', 260.00, 40)
) as seed(name, description, pricing_type, unit, price, sort_order)
cross join public.price_lists pl
join public.pricing_categories c
  on lower(c.name) = lower('Make Ready')
where lower(pl.name) = lower('Basic Make Ready')
and not exists (
  select 1
  from public.pricing_items pi
  where pi.price_list_id = pl.id
    and pi.category_id = c.id
    and lower(pi.name) = lower(seed.name)
);


-- ============================================================
-- MAKE READY ADD-ONS
-- ============================================================

insert into public.pricing_items (
  price_list_id,
  category_id,
  name,
  pricing_type,
  unit,
  price,
  sort_order
)
select
  pl.id,
  c.id,
  seed.name,
  seed.pricing_type,
  seed.unit,
  seed.price,
  seed.sort_order
from (
  values
    ('Disposal replacement', 'per_item', 'each', 50.00, 10),
    ('Fridge install', 'per_item', 'each', 65.00, 20),
    ('Dishwasher install', 'per_item', 'each', 65.00, 30),
    ('Removal of appliances', 'per_item', 'each', 40.00, 40),
    ('Microwave install', 'per_item', 'each', 50.00, 50),
    ('Stove install', 'per_item', 'each', 65.00, 60),
    ('Venthood install', 'per_item', 'each', 50.00, 70),
    ('Ceiling fan replacement', 'per_item', 'each', 35.00, 80),
    ('Install vertical blinds with hardware', 'per_item', 'each', 20.00, 90),
    ('Replace light fixtures', 'per_item', 'each', 30.00, 100),
    ('Replace all cover plates', 'flat', 'job', 65.00, 110),
    ('Install exhaust fan', 'per_item', 'each', 45.00, 120),
    ('Replace door knocker / peephole', 'per_item', 'each', 20.00, 130),
    ('Replace faucet', 'per_item', 'each', 30.00, 140),
    ('Replace tub & shower head with hardware', 'per_item', 'each', 35.00, 150),
    ('Replace towel bar', 'per_item', 'each', 12.00, 160),
    ('Kitchen sink replacement', 'flat', 'job', 55.00, 170),
    ('Replace faucet - alternate rate', 'per_item', 'each', 35.00, 180),
    ('Replace GFI', 'per_item', 'each', 10.00, 190),
    ('Replace smoke alarms', 'per_item', 'each', 15.00, 200),
    ('Re-key locks', 'per_item', 'each', 25.00, 210),
    ('Install mini blinds with hardware', 'per_item', 'each', 12.00, 220),
    ('Replace interior doors', 'per_item', 'each', 45.00, 230),
    ('Replace door jambs', 'per_item', 'each', 150.00, 240),
    ('Replace all knobs / handles', 'flat', 'job', 75.00, 250),
    ('Replace lock', 'per_item', 'each', 20.00, 260),
    ('Install toilet', 'per_item', 'each', 70.00, 270),
    ('Replace supply lines', 'per_item', 'each', 7.00, 280),
    ('Replace toilet paper holder', 'per_item', 'each', 10.00, 290),
    ('Bathroom sink replacement', 'flat', 'job', 45.00, 300),
    ('Replace sink pop-up', 'per_item', 'each', 10.00, 310),
    ('Replace cut off', 'per_item', 'each', 7.00, 320),
    ('Replace thermostat', 'per_item', 'each', 20.00, 330)
) as seed(name, pricing_type, unit, price, sort_order)
cross join public.price_lists pl
join public.pricing_categories c
  on lower(c.name) = lower('Make Ready Add-ons')
where lower(pl.name) = lower('Basic Make Ready')
and not exists (
  select 1
  from public.pricing_items pi
  where pi.price_list_id = pl.id
    and pi.category_id = c.id
    and lower(pi.name) = lower(seed.name)
);


-- ============================================================
-- PAINTER ABBREVIATIONS
-- ============================================================

insert into public.pricing_items (
  price_list_id,
  category_id,
  name,
  abbreviation,
  description,
  pricing_type,
  unit,
  price,
  sort_order
)
select
  pl.id,
  c.id,
  seed.name,
  seed.abbreviation,
  seed.description,
  'flat',
  null,
  0,
  seed.sort_order
from (
  values
    ('Full Paint Walls', 'FPW', 'Full Paint Walls.', 10),
    ('Full Paint Walls - Color Change', 'FPW-CC', 'Full Paint Walls - Color Change.', 20),
    ('Paint Ceiling', 'PC', 'Paint Ceiling.', 30),
    ('Touch Up Paint', 'T-up', 'Touch Up Paint.', 40),
    ('Replace Sheetrock - Wall', 'SRR-W', 'Replace Sheetrock - Wall.', 50),
    ('Replace Sheetrock - Ceiling', 'SRR-C', 'Replace Sheetrock - Ceiling.', 60),
    ('Tape, Float, Texture - Wall', 'TFT-W', 'Tape, Float, Texture - Wall.', 70),
    ('Tape, Float, Texture - Ceiling', 'TFT-C', 'Tape, Float, Texture - Ceiling.', 80),
    ('Kitchen Cabinets - White on White', 'KCWW', 'Kitchen Cabinets - White on White.', 90),
    ('Kitchen Cabinets - Brown to White', 'KCBW', 'Kitchen Cabinets - Brown to White.', 100),
    ('Bathroom Cabinets - White on White', 'BCWW', 'Bathroom Cabinets - White on White.', 110),
    ('Bathroom Cabinets - Brown to White', 'BCBW', 'Bathroom Cabinets - Brown to White.', 120)
) as seed(name, abbreviation, description, sort_order)
cross join public.price_lists pl
join public.pricing_categories c
  on lower(c.name) = lower('Painting Abbreviations')
where lower(pl.name) = lower('Painter Price List')
and not exists (
  select 1
  from public.pricing_items pi
  where pi.price_list_id = pl.id
    and pi.category_id = c.id
    and lower(pi.abbreviation) = lower(seed.abbreviation)
);


-- ============================================================
-- PAINTER PRICE LIST
-- ============================================================

insert into public.pricing_items (
  price_list_id,
  category_id,
  name,
  pricing_type,
  unit,
  price,
  sort_order
)
select
  pl.id,
  c.id,
  seed.name,
  seed.pricing_type,
  seed.unit,
  seed.price,
  seed.sort_order
from (
  values
    ('Walls - One Color', 'per_sq_ft', 'sq ft', 0.09, 10),
    ('Walls - Two Colors', 'per_sq_ft', 'sq ft', 0.11, 20),
    ('Walls - Roll and Brush', 'per_sq_ft', 'sq ft', 0.12, 30),
    ('Walls - Roll and Brush - CC', 'per_sq_ft', 'sq ft', 0.18, 40),
    ('Walls - Color Change', 'per_sq_ft', 'sq ft', 0.15, 50),
    ('Walls - Flat to Semi', 'per_sq_ft', 'sq ft', 0.13, 60),
    ('Walls - Sheen Change', 'per_sq_ft', 'sq ft', 0.13, 70),
    ('Doors / Trim - Color Change', 'per_sq_ft', 'sq ft', 0.05, 80),
    ('Ceiling', 'per_sq_ft', 'sq ft', 0.06, 90),
    ('Ceilings - Color Change', 'per_sq_ft', 'sq ft', 0.07, 100),
    ('Ceilings - Prime / Paint', 'per_sq_ft', 'sq ft', 0.05, 110),
    ('Ceilings - Roll and Brush', 'per_sq_ft', 'sq ft', 0.08, 120),
    ('Touch Up Walls/Ceil', 'per_sq_ft', 'sq ft', 0.06, 130),
    ('Paint Accent Wall', 'per_wall', 'wall', 20.00, 140),
    ('Remove Accent Wall', 'per_wall', 'wall', 10.00, 150),
    ('Crown Molding', 'per_area', 'area', 10.00, 160)
) as seed(name, pricing_type, unit, price, sort_order)
cross join public.price_lists pl
join public.pricing_categories c
  on lower(c.name) = lower('Painting')
where lower(pl.name) = lower('Painter Price List')
and not exists (
  select 1
  from public.pricing_items pi
  where pi.price_list_id = pl.id
    and pi.category_id = c.id
    and lower(pi.name) = lower(seed.name)
);


-- ============================================================
-- CABINETS
-- ============================================================

insert into public.pricing_items (
  price_list_id,
  category_id,
  name,
  abbreviation,
  pricing_type,
  unit,
  price,
  sort_order
)
select
  pl.id,
  c.id,
  seed.name,
  seed.abbreviation,
  'flat',
  'job',
  seed.price,
  seed.sort_order
from (
  values
    ('Kitchen Cabinets - White on White', 'KCWW', 35.00, 10),
    ('Bathroom Cabinets - White on White', 'BCWW', 15.00, 20),
    ('Kitchen Cabinets - Brown to White', 'KCBW', 70.00, 30),
    ('Bathroom Cabinets - Brown to White', 'BCBW', 30.00, 40)
) as seed(name, abbreviation, price, sort_order)
cross join public.price_lists pl
join public.pricing_categories c
  on lower(c.name) = lower('Cabinets')
where lower(pl.name) = lower('Painter Price List')
and not exists (
  select 1
  from public.pricing_items pi
  where pi.price_list_id = pl.id
    and pi.category_id = c.id
    and lower(pi.name) = lower(seed.name)
);


-- ============================================================
-- SHEETROCK
-- ============================================================

insert into public.pricing_items (
  price_list_id,
  category_id,
  name,
  pricing_type,
  unit,
  price,
  sort_order
)
select
  pl.id,
  c.id,
  seed.name,
  'flat',
  seed.unit,
  seed.price,
  seed.sort_order
from (
  values
    ('Door Knob Size Hole Repair - Wall', 'job', 5.00, 10),
    ('Door Knob Size Hole Repair - Ceiling', 'job', 7.00, 20),
    ('Door Knob Size Hole Repair - Occupied', 'job', 10.00, 30),
    ('1x1 - 1x2 - Wall', 'job', 25.00, 40),
    ('1x1 - 1x2 - Ceiling', 'job', 30.00, 50),
    ('1x1 - 1x2 - Occupied', 'job', 30.00, 60),
    ('2x2 - 2x3 - Wall', 'job', 30.00, 70),
    ('2x2 - 2x3 - Ceiling', 'job', 35.00, 80),
    ('2x2 - 2x3 - Occupied', 'job', 40.00, 90),
    ('3x3 - 3x4 - Wall', 'job', 35.00, 100),
    ('3x3 - 3x4 - Ceiling', 'job', 40.00, 110),
    ('3x3 - 3x4 - Occupied', 'job', 40.00, 120),
    ('4x5 - 4x6 - Wall', 'job', 40.00, 130),
    ('4x5 - 4x6 - Ceiling', 'job', 40.00, 140),
    ('4x5 - 4x6 - Occupied', 'job', 50.00, 150),
    ('4x7 - 4x8 - Wall', 'job', 45.00, 160),
    ('4x7 - 4x8 - Ceiling', 'job', 50.00, 170),
    ('4x7 - 4x8 - Occupied', 'job', 55.00, 180)
) as seed(name, unit, price, sort_order)
cross join public.price_lists pl
join public.pricing_categories c
  on lower(c.name) = lower('Sheetrock')
where lower(pl.name) = lower('Painter Price List')
and not exists (
  select 1
  from public.pricing_items pi
  where pi.price_list_id = pl.id
    and pi.category_id = c.id
    and lower(pi.name) = lower(seed.name)
);


-- ============================================================
-- TAPE / FLOAT / TEXTURE
-- ============================================================

insert into public.pricing_items (
  price_list_id,
  category_id,
  name,
  pricing_type,
  unit,
  price,
  sort_order
)
select
  pl.id,
  c.id,
  seed.name,
  'flat',
  'job',
  seed.price,
  seed.sort_order
from (
  values
    ('1x1 - 1x2 - Wall', 'job', 18.00, 10),
    ('1x1 - 1x2 - Ceiling', 'job', 18.00, 20),
    ('1x1 - 1x2 - Occupied', 'job', 22.00, 30),
    ('2x3 - 2x4 - Wall', 'job', 20.00, 40),
    ('2x3 - 2x4 - Ceiling', 'job', 22.00, 50),
    ('2x3 - 2x4 - Occupied', 'job', 25.00, 60),
    ('2x5 - 2x6 - Wall', 'job', 22.00, 70),
    ('2x5 - 2x6 - Ceiling', 'job', 25.00, 80),
    ('2x5 - 2x6 - Occupied', 'job', 27.00, 90),
    ('2x7 - 2x8 - Wall', 'job', 25.00, 100),
    ('2x7 - 2x8 - Ceiling', 'job', 28.00, 110),
    ('2x7 - 2x8 - Occupied', 'job', 33.00, 120)
) as seed(name, unit, price, sort_order)
cross join public.price_lists pl
join public.pricing_categories c
  on lower(c.name) = lower('Tape / Float / Texture')
where lower(pl.name) = lower('Painter Price List')
and not exists (
  select 1
  from public.pricing_items pi
  where pi.price_list_id = pl.id
    and pi.category_id = c.id
    and lower(pi.name) = lower(seed.name)
);


-- ============================================================
-- MISC PAINTER SERVICES
-- ============================================================

insert into public.pricing_items (
  price_list_id,
  category_id,
  name,
  pricing_type,
  unit,
  price,
  sort_order
)
select
  pl.id,
  c.id,
  seed.name,
  seed.pricing_type,
  seed.unit,
  seed.price,
  seed.sort_order
from (
  values
    ('Replace / Repair baseboard', 'per_sq_ft', 'sq ft', 0.05, 10),
    ('Replace / Repair trim', 'per_sq_ft', 'sq ft', 0.05, 20),
    ('Front Door', 'flat', 'door', 15.00, 30),
    ('Paint Garage', 'flat', 'garage', 25.00, 40),
    ('Kitchen, Bathroom, Vanity, Living and Diningroom each', 'flat', 'room', 32.50, 50),
    ('Wallpaper Removal', 'flat', 'job', 10.00, 60)
) as seed(name, pricing_type, unit, price, sort_order)
cross join public.price_lists pl
join public.pricing_categories c
  on lower(c.name) = lower('Miscellaneous')
where lower(pl.name) = lower('Painter Price List')
and not exists (
  select 1
  from public.pricing_items pi
  where pi.price_list_id = pl.id
    and pi.category_id = c.id
    and lower(pi.name) = lower(seed.name)
);


-- ============================================================
-- COMMENTS
-- ============================================================

comment on table public.price_lists is
  'Elite Apartment Services pricing schedules.';

comment on table public.pricing_categories is
  'Categories used to organize Elite Apartment Services pricing.';

comment on table public.pricing_items is
  'Individual services, abbreviations, units and rates used by Elite Apartment Services.';

comment on column public.pricing_items.abbreviation is
  'Internal Elite Apartment Services abbreviation/code for the pricing item.';

comment on column public.pricing_items.pricing_type is
  'How the price is calculated: flat, per_sq_ft, per_wall, per_room, per_unit, per_item, per_area, or per_estimate.';
