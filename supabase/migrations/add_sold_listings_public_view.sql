-- Sold listings remain publicly viewable (SEO + seller reputation).
-- Extends public read access from active-only to active + sold.

create policy "Anyone can view sold listings"
  on public.listings for select
  using (status = 'sold');

create policy "Anyone can view images of sold listings"
  on public.listing_images for select
  using (
    exists (
      select 1 from public.listings
      where id = listing_id and status = 'sold'
    )
  );
