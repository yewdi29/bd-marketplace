-- Combined photo + video display order for seller gallery and public listing page.

alter table public.listing_images
  add column if not exists gallery_position integer;

alter table public.listing_videos
  add column if not exists gallery_position integer;

-- Backfill photos from existing sort_order.
update public.listing_images
set gallery_position = sort_order
where gallery_position is null;

-- Backfill eligible videos after each listing's photos.
with video_rank as (
  select
    lv.id,
    lv.listing_id,
    row_number() over (
      partition by lv.listing_id
      order by lv.position asc, lv.created_at asc
    ) - 1 as video_offset,
    coalesce(
      (
        select max(li.gallery_position)
        from public.listing_images li
        where li.listing_id = lv.listing_id
      ),
      -1
    ) as max_photo_position
  from public.listing_videos lv
  where lv.status not in ('rejected_too_long', 'error')
    and lv.gallery_position is null
)
update public.listing_videos lv
set gallery_position = vr.max_photo_position + 1 + vr.video_offset
from video_rank vr
where lv.id = vr.id;

create index if not exists listing_images_gallery_position_idx
  on public.listing_images (listing_id, gallery_position);

create index if not exists listing_videos_gallery_position_idx
  on public.listing_videos (listing_id, gallery_position)
  where gallery_position is not null;
