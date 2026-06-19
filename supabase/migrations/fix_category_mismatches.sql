-- ============================================================
-- Fix listings whose category_id is wrong or too coarse
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → Run).
--
-- The original backfill mapped legacy `category` text to category_id
-- using only the legacy slug (e.g. 'rental_tools' → 'Fishing & Rental
-- Tools'), which is too coarse — a listing titled "Triangular Pipe
-- Racks" with legacy category 'rental_tools' landed in the wrong
-- category. This re-derives category_id from title keywords, which
-- carry a more specific signal than the legacy field. Only overrides
-- a listing when a keyword clearly matches — leaves everything else
-- (already correctly mapped) untouched. Safe to re-run.
-- ============================================================

update public.listings l
set category_id = c.id,
    industry_id = (select id from public.industries where slug = 'oil_gas')
from public.categories c
where c.name = (
  case
    when l.title ~* 'pipe rack' or l.title ~* 'pipe stacker'                          then 'Pipe Racks'
    when l.title ~* 'drill pipe' or l.title ~* 'drill collar' or l.title ~* 'tubular'  then 'Drill Pipe & Tubulars'
    when l.title ~* 'coiled tubing' or l.title ~* 'coil tubing'                        then 'Coiled Tubing Equipment'
    when l.title ~* 'workover rig' or l.title ~* 'well service rig'                    then 'Workover & Well Service Rigs'
    when l.title ~* 'drilling rig'                                                     then 'Drilling Rigs'
    when l.title ~* 'blowout preventer' or l.title ~* '\mbop\M'
      or l.title ~* 'wellhead' or l.title ~* 'christmas tree'                          then 'Wellhead Equipment'
    when l.title ~* 'mud pump' or l.title ~* 'pump jack' or l.title ~* 'pumping unit'   then 'Pumps & Pump Jacks'
    when l.title ~* 'separator' or l.title ~* '\mtank\M'                               then 'Separators & Tanks'
    when l.title ~* 'compressor'                                                       then 'Compressors'
    when l.title ~* 'drill bit'                                                        then 'Drill Bits'
    else null
  end
);
