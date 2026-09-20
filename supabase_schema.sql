-- ==============================================================================
-- AnimeVerse - Complete Supabase Database Schema with Row Level Security (RLS)
-- ==============================================================================

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  avatar_url text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can delete their own profile"
  on public.profiles for delete
  using (auth.uid() = id);


-- 2. WATCHLISTS TABLE
create table if not exists public.watchlists (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade not null,
  anime_id integer not null,
  title text not null,
  romaji_title text,
  cover_image text,
  status text not null check (status in ('watching', 'plan_to_watch', 'completed', 'dropped')),
  episodes integer default 0,
  average_score integer,
  genres text[],
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  constraint unique_user_anime_watchlist unique (user_id, anime_id)
);

-- Enable RLS for watchlists
alter table public.watchlists enable row level security;

-- Watchlists Policies
create policy "Users can view their own watchlist"
  on public.watchlists for select
  using (auth.uid() = user_id);

create policy "Users can insert into their own watchlist"
  on public.watchlists for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own watchlist"
  on public.watchlists for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete from their own watchlist"
  on public.watchlists for delete
  using (auth.uid() = user_id);

create index if not exists idx_watchlists_user on public.watchlists(user_id);
create index if not exists idx_watchlists_user_status on public.watchlists(user_id, status);


-- 3. FAVORITES TABLE
create table if not exists public.favorites (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade not null,
  anime_id integer not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  constraint unique_user_anime_favorite unique (user_id, anime_id)
);

-- Enable RLS for favorites
alter table public.favorites enable row level security;

-- Favorites Policies
create policy "Users can view their own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Users can add to their own favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete from their own favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);

create index if not exists idx_favorites_user on public.favorites(user_id);


-- 4. EPISODE PROGRESS TABLE
create table if not exists public.episode_progress (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade not null,
  anime_id integer not null,
  episode_number integer not null,
  is_watched boolean default true not null,
  last_watched_at timestamptz default timezone('utc'::text, now()) not null,
  constraint unique_user_anime_episode unique (user_id, anime_id, episode_number)
);

-- Enable RLS for episode progress
alter table public.episode_progress enable row level security;

-- Episode Progress Policies
create policy "Users can view their own episode progress"
  on public.episode_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert their own episode progress"
  on public.episode_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own episode progress"
  on public.episode_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own episode progress"
  on public.episode_progress for delete
  using (auth.uid() = user_id);

create index if not exists idx_episodes_user_anime on public.episode_progress(user_id, anime_id);


-- 5. FOLLOWED ANIME TABLE
create table if not exists public.followed_anime (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade not null,
  anime_id integer not null,
  title text not null,
  cover_image text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  constraint unique_user_followed_anime unique (user_id, anime_id)
);

-- Enable RLS for followed_anime
alter table public.followed_anime enable row level security;

-- Followed Anime Policies
create policy "Users can view their own followed anime"
  on public.followed_anime for select
  using (auth.uid() = user_id);

create policy "Users can follow an anime"
  on public.followed_anime for insert
  with check (auth.uid() = user_id);

create policy "Users can unfollow an anime"
  on public.followed_anime for delete
  using (auth.uid() = user_id);

create index if not exists idx_followed_user on public.followed_anime(user_id);


-- 6. ANIME RATINGS TABLE
create table if not exists public.anime_ratings (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade not null,
  anime_id integer not null,
  rating integer not null check (rating >= 1 and rating <= 10),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  constraint unique_user_anime_rating unique (user_id, anime_id)
);

alter table public.anime_ratings enable row level security;

create policy "Anyone can read ratings"
  on public.anime_ratings for select
  using (true);

create policy "Users can insert their own rating"
  on public.anime_ratings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own rating"
  on public.anime_ratings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own rating"
  on public.anime_ratings for delete
  using (auth.uid() = user_id);

create index if not exists idx_ratings_anime on public.anime_ratings(anime_id);


-- 7. ANIME REVIEWS TABLE
create table if not exists public.anime_reviews (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade not null,
  anime_id integer not null,
  rating integer not null check (rating >= 1 and rating <= 10),
  review_text text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.anime_reviews enable row level security;

create policy "Anyone can read reviews"
  on public.anime_reviews for select
  using (true);

create policy "Users can insert their own review"
  on public.anime_reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own review"
  on public.anime_reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own review"
  on public.anime_reviews for delete
  using (auth.uid() = user_id);

create index if not exists idx_reviews_anime on public.anime_reviews(anime_id);


-- 8. REVIEW LIKES TABLE (Helpful counter)
create table if not exists public.review_likes (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade not null,
  review_id bigint references public.anime_reviews(id) on delete cascade not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  constraint unique_user_review_like unique (user_id, review_id)
);

alter table public.review_likes enable row level security;

create policy "Anyone can view review likes"
  on public.review_likes for select
  using (true);

create policy "Users can like a review"
  on public.review_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike a review"
  on public.review_likes for delete
  using (auth.uid() = user_id);


-- 9. ANIME COMMENTS TABLE
create table if not exists public.anime_comments (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade not null,
  anime_id integer not null,
  comment_text text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.anime_comments enable row level security;

create policy "Anyone can read comments"
  on public.anime_comments for select
  using (true);

create policy "Users can insert their own comment"
  on public.anime_comments for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own comment"
  on public.anime_comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own comment"
  on public.anime_comments for delete
  using (auth.uid() = user_id);

create index if not exists idx_comments_anime on public.anime_comments(anime_id);


-- 10. COMMENT LIKES TABLE
create table if not exists public.comment_likes (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade not null,
  comment_id bigint references public.anime_comments(id) on delete cascade not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  constraint unique_user_comment_like unique (user_id, comment_id)
);

alter table public.comment_likes enable row level security;

create policy "Anyone can view comment likes"
  on public.comment_likes for select
  using (true);

create policy "Users can like a comment"
  on public.comment_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike a comment"
  on public.comment_likes for delete
  using (auth.uid() = user_id);


-- 11. MODERATION REPORTS TABLE
create table if not exists public.moderation_reports (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade not null,
  target_type text not null check (target_type in ('review', 'comment', 'user')),
  target_id bigint not null,
  reason text not null check (reason in ('spam', 'harassment', 'copyright', 'inappropriate', 'other')),
  details text,
  status text default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.moderation_reports enable row level security;

create policy "Users can submit moderation reports"
  on public.moderation_reports for insert
  with check (auth.uid() = user_id);

create policy "Users cannot read reports"
  on public.moderation_reports for select
  using (false);


-- 12. NOTIFICATIONS TABLE
create table if not exists public.notifications (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null check (type in ('episode_release', 'review_liked', 'comment_reply', 'system')),
  title text not null,
  message text not null,
  link text,
  is_read boolean default false not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;

create policy "Users can read their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

create index if not exists idx_notifications_user on public.notifications(user_id, is_read);


-- 13. TRIGGER FOR AUTOMATIC PROFILE CREATION ON USER SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=' || new.id),
    now(),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 14. APPROVED YOUTUBE CHANNELS (Configurable Official Channels Registry)
create table if not exists public.approved_youtube_channels (
  id bigserial primary key,
  channel_id text unique not null,
  channel_name text not null,
  handle text,
  region text default 'IN',
  is_active boolean default true,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.approved_youtube_channels enable row level security;

-- Public can view active approved channels
create policy "Anyone can view active approved channels"
  on public.approved_youtube_channels for select
  using (is_active = true);

-- Authenticated users can manage channels
create policy "Authenticated users can insert approved channels"
  on public.approved_youtube_channels for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update approved channels"
  on public.approved_youtube_channels for update
  using (auth.role() = 'authenticated');

create policy "Authenticated users can delete approved channels"
  on public.approved_youtube_channels for delete
  using (auth.role() = 'authenticated');

-- Pre-seed approved official anime distributors for India and Asia
insert into public.approved_youtube_channels (channel_id, channel_name, handle, region, is_active)
values 
  ('UCcDvQM6NucVAlpryMA2K19A', 'Ani-One India', '@AniOneIndia', 'IN', true),
  ('UCYYhAzgWuxPauRXdPpLAX3Q', 'Muse India', '@MuseIndiaChannel', 'IN', true),
  ('UCGbshtvS9t-8CW11W7TooQg', 'Muse Asia', '@MuseAsia', 'IN', true),
  ('UC0wNSTMWIL3qaorLx0jie6A', 'Ani-One Asia', '@AniOneAsia', 'IN', true),
  ('UCejtUitnpnf8Be-v5NuDSLw', 'GundamInfo', '@GundamInfo', 'GLOBAL', true)
on conflict (channel_id) do update set
  channel_name = excluded.channel_name,
  handle = excluded.handle,
  region = excluded.region,
  is_active = excluded.is_active;


-- 15. WATCH SOURCES (Cached Verified YouTube Episodes & Streams)
create table if not exists public.watch_sources (
  id bigserial primary key,
  anime_id integer not null,
  provider text not null default 'youtube',
  channel_name text not null,
  channel_id text not null,
  video_id text not null,
  playlist_id text,
  episode_number integer not null default 1,
  season_number integer not null default 1,
  language text default 'ja-JP / en-Sub',
  language_status text default 'verified',
  region text default 'IN',
  is_official boolean default true,
  is_embeddable boolean default true,
  match_confidence numeric default 1.0,
  verification_status text default 'verified', -- 'verified', 'pending', 'rejected', 'region_restricted', 'unavailable'
  source_url text,
  video_title text,
  thumbnail_url text,
  verified_at timestamptz default timezone('utc'::text, now()) not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  constraint unique_anime_source unique (anime_id, provider, season_number, episode_number, video_id)
);

alter table public.watch_sources enable row level security;

-- Public can view verified official embeddable watch sources
create policy "Anyone can view verified official watch sources"
  on public.watch_sources for select
  using (is_official = true and is_embeddable = true and (verification_status = 'verified' or verification_status is null));

-- Safe insert policy for watch sources
create policy "Anyone can insert watch sources"
  on public.watch_sources for insert
  with check (is_official = true and is_embeddable = true);

create policy "Anyone can update watch sources"
  on public.watch_sources for update
  using (is_official = true);

create policy "Anyone can delete watch sources"
  on public.watch_sources for delete
  using (auth.role() = 'authenticated');

create index if not exists idx_watch_sources_lookup on public.watch_sources(anime_id, provider, season_number, episode_number);
create index if not exists idx_watch_sources_status on public.watch_sources(verification_status);
create index if not exists idx_watch_sources_channel on public.watch_sources(channel_id);


-- 16. DISCOVERY QUEUE (Controlled Batch YouTube Scanning & Quota Protection)
create table if not exists public.discovery_queue (
  anime_id integer primary key,
  title text not null,
  status text not null default 'queued', -- 'not_scanned', 'queued', 'scanning', 'completed', 'needs_review', 'failed'
  priority integer not null default 3, -- 1 = Popular/Airing, 2 = User requested, 3 = Recent, 4 = Catalog
  attempts integer not null default 0,
  last_scanned_at timestamptz,
  next_scan_at timestamptz default timezone('utc'::text, now()),
  error_message text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.discovery_queue enable row level security;

create policy "Anyone can view discovery queue"
  on public.discovery_queue for select
  using (true);

create policy "Anyone can enqueue anime"
  on public.discovery_queue for insert
  with check (true);

create policy "Anyone can update discovery queue"
  on public.discovery_queue for update
  using (true);

create index if not exists idx_discovery_queue_status on public.discovery_queue(status, priority);


