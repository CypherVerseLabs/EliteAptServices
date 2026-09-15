-- ============================================================
-- ELITE APARTMENT SERVICES
-- SERVICE PRICING
-- ============================================================

-- Remove existing pricing rows for this company so this migration
-- can safely be re-run during development.
DELETE FROM public.service_pricing
WHERE apartment_company_id =
  '1e879c9a-2220-434c-91ce-eb4c28a5a477';


-- ============================================================
-- BASIC MAKE READY
-- ============================================================

INSERT INTO public.service_pricing
(
  apartment_company_id,
  service_category,
  pricing_type,
  price,
  active
)
VALUES

-- Basic make ready by unit size
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'make_ready_1_bedroom',
  'per_unit',
  175.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'make_ready_2_bedroom',
  'per_unit',
  205.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'make_ready_3_bedroom',
  'per_unit',
  235.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'make_ready_4_bedroom',
  'per_unit',
  260.00,
  true
);


-- ============================================================
-- MAKE READY APPLIANCES / ADD-ONS
-- ============================================================

INSERT INTO public.service_pricing
(
  apartment_company_id,
  service_category,
  pricing_type,
  price,
  active
)
VALUES
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'disposal_replacement',
  'per_item',
  50.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'fridge_install',
  'per_item',
  65.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'dishwasher_install',
  'per_item',
  65.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'appliance_removal',
  'per_item',
  40.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'microwave_install',
  'per_item',
  50.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'stove_install',
  'per_item',
  65.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'venthood_install',
  'per_item',
  50.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'ceiling_fan_replacement',
  'per_item',
  35.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'vertical_blinds_install',
  'per_item',
  20.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'light_fixture_replacement',
  'per_item',
  30.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'cover_plates_replacement',
  'flat',
  65.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'exhaust_fan_install',
  'per_item',
  45.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'door_knocker_peephole',
  'per_item',
  20.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'faucet_replacement',
  'per_item',
  30.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'tub_shower_head_replacement',
  'per_item',
  35.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'towel_bar_replacement',
  'per_item',
  12.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'kitchen_sink_replacement',
  'per_item',
  55.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'gfi_replacement',
  'per_item',
  10.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'smoke_alarm_replacement',
  'per_item',
  15.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'rekey_lock',
  'per_item',
  25.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'mini_blinds_install',
  'per_item',
  12.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'interior_door_replacement',
  'per_item',
  45.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'door_jamb_replacement',
  'per_item',
  150.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'knobs_handles_replacement',
  'flat',
  75.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'lock_replacement',
  'per_item',
  20.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'toilet_install',
  'per_item',
  70.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'supply_line_replacement',
  'per_item',
  7.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'toilet_paper_holder',
  'per_item',
  10.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'bathroom_sink_replacement',
  'per_item',
  45.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'sink_pop_up_replacement',
  'per_item',
  10.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'cut_off_replacement',
  'per_item',
  7.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'thermostat_replacement',
  'per_item',
  20.00,
  true
);


-- ============================================================
-- PAINTER PRICING
-- ============================================================

INSERT INTO public.service_pricing
(
  apartment_company_id,
  service_category,
  pricing_type,
  price,
  active
)
VALUES
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'painting_walls_one_color',
  'per_sq_ft',
  0.09,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'painting_walls_two_colors',
  'per_sq_ft',
  0.11,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'painting_walls_roll_brush',
  'per_sq_ft',
  0.12,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'painting_walls_roll_brush_color_change',
  'per_sq_ft',
  0.18,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'painting_walls_color_change',
  'per_sq_ft',
  0.15,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'painting_walls_flat_to_semi',
  'per_sq_ft',
  0.13,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'painting_walls_sheen_change',
  'per_sq_ft',
  0.13,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'doors_trim_color_change',
  'per_sq_ft',
  0.05,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'ceiling',
  'per_sq_ft',
  0.06,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'ceiling_color_change',
  'per_sq_ft',
  0.07,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'ceiling_prime_paint',
  'per_sq_ft',
  0.05,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'ceiling_roll_brush',
  'per_sq_ft',
  0.08,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'touch_up_walls_ceiling',
  'per_sq_ft',
  0.06,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'accent_wall',
  'per_wall',
  20.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'remove_accent_wall',
  'per_wall',
  10.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'crown_molding',
  'per_area',
  10.00,
  true
);


-- ============================================================
-- CABINETS
-- ============================================================

INSERT INTO public.service_pricing
(
  apartment_company_id,
  service_category,
  pricing_type,
  price,
  active
)
VALUES
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'kitchen_cabinets_white_white',
  'per_unit',
  35.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'bathroom_cabinets_white_white',
  'per_unit',
  15.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'kitchen_cabinets_brown_white',
  'per_unit',
  70.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'bathroom_cabinets_brown_white',
  'per_unit',
  30.00,
  true
);


-- ============================================================
-- TILE WORK
-- ============================================================

INSERT INTO public.service_pricing
(
  apartment_company_id,
  service_category,
  pricing_type,
  price,
  active
)
VALUES
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'tile_1x1_wall',
  'per_area',
  50.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'tile_2x2_wall',
  'per_area',
  80.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'tile_3x3_wall',
  'per_area',
  100.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'tile_all_3_walls',
  'flat',
  300.00,
  true
);


-- ============================================================
-- SHEETROCK
-- ============================================================

INSERT INTO public.service_pricing
(
  apartment_company_id,
  service_category,
  pricing_type,
  price,
  active
)
VALUES
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'sheetrock_door_knob_hole',
  'per_item',
  5.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'sheetrock_1x1_1x2_wall',
  'per_area',
  25.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'sheetrock_2x2_2x3_wall',
  'per_area',
  30.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'sheetrock_3x3_3x4_wall',
  'per_area',
  35.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'sheetrock_4x5_4x6_wall',
  'per_area',
  40.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'sheetrock_4x7_4x8_wall',
  'per_area',
  45.00,
  true
);


-- ============================================================
-- TAPE / FLOAT / TEXTURE
-- ============================================================

INSERT INTO public.service_pricing
(
  apartment_company_id,
  service_category,
  pricing_type,
  price,
  active
)
VALUES
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'tape_float_texture_1x1_1x2',
  'per_area',
  18.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'tape_float_texture_2x3_2x4',
  'per_area',
  20.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'tape_float_texture_2x5_2x6',
  'per_area',
  22.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'tape_float_texture_2x7_2x8',
  'per_area',
  25.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'texture_kitchen_bath_vanity_living_dining',
  'per_area',
  32.50,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'wallpaper_removal',
  'per_area',
  10.00,
  true
);


-- ============================================================
-- HOUSEKEEPING
-- ============================================================

INSERT INTO public.service_pricing
(
  apartment_company_id,
  service_category,
  pricing_type,
  price,
  active
)
VALUES
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'housekeeping_1_bedroom',
  'per_unit',
  105.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'housekeeping_2_bedroom_1_bath',
  'per_unit',
  115.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'housekeeping_2_bedroom_2_bath',
  'per_unit',
  125.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'housekeeping_3_bedroom',
  'per_unit',
  135.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'housekeeping_4_bedroom',
  'per_unit',
  170.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'housekeeping_touch_up',
  'per_unit',
  50.00,
  true
);


-- ============================================================
-- CARPET CLEANING
-- ============================================================

INSERT INTO public.service_pricing
(
  apartment_company_id,
  service_category,
  pricing_type,
  price,
  active
)
VALUES
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'carpet_cleaning_studio',
  'per_unit',
  15.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'carpet_cleaning_1_bedroom',
  'per_unit',
  40.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'carpet_cleaning_2_bedroom',
  'per_unit',
  50.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'carpet_cleaning_3_bedroom',
  'per_unit',
  60.00,
  true
);


-- ============================================================
-- RESURFACING
-- ============================================================

INSERT INTO public.service_pricing
(
  apartment_company_id,
  service_category,
  pricing_type,
  price,
  active
)
VALUES
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'resurface_kitchen_countertop_sparkle',
  'per_item',
  90.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'resurface_wall_dry_bar_desk',
  'per_item',
  50.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'resurface_kitchen_sink',
  'per_item',
  65.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'resurface_bath_counter_vanity_sparkle',
  'per_item',
  50.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'resurface_bath_sink',
  'per_item',
  55.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'resurface_bathtub',
  'per_item',
  130.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'resurface_tile_wall',
  'per_item',
  130.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'resurface_tub_enclosure',
  'per_item',
  225.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'resurface_garden_tub',
  'per_item',
  175.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'resurface_single_vanity_cap_sink',
  'per_item',
  100.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'resurface_double_vanity_cap_sink',
  'per_item',
  140.00,
  true
),
(
  '1e879c9a-2220-434c-91ce-eb4c28a5a477',
  'resurface_clear_coat',
  'per_item',
  5.00,
  true
);


-- ============================================================
-- VERIFY
-- ============================================================

SELECT
  service_category,
  pricing_type,
  price,
  active
FROM public.service_pricing
WHERE apartment_company_id =
  '1e879c9a-2220-434c-91ce-eb4c28a5a477'
ORDER BY service_category;
