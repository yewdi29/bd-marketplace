-- Track when the seller NewInquirySeller email was sent (dedup + fallback cron).

alter table public.leads
  add column if not exists seller_inquiry_email_sent_at timestamptz;

comment on column public.leads.seller_inquiry_email_sent_at is
  'Set when NewInquirySeller is sent for green-tier inquiries — prevents duplicate seller emails.';

create index if not exists leads_seller_inquiry_email_pending_idx
  on public.leads (created_at)
  where seller_inquiry_email_sent_at is null
    and listing_id is not null
    and status = 'new'
    and tier = 'green';
