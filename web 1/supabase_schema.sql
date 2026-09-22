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
  ('UCejtUitnpnf8Be-v5NuDSLw', 'GundamInfo', '@GundamInfo', 'GLOBAL', true),
  ('UC_jZH5w5iZDk3lWhrHigMZw', 'Pokémon Asia Official (Telugu)', '@PokemonTeluguOfficial', 'IN', true)
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


-- 17. DAILY UNIQUE VISITORS ANALYTICS
create table if not exists public.daily_visitors (
  id bigserial primary key,
  visitor_id text not null,
  visit_date date not null default current_date,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  constraint unique_visitor_per_day unique (visitor_id, visit_date)
);

alter table public.daily_visitors enable row level security;

-- Allow anonymous visitors to record their daily visit
create policy "Allow anonymous insert for daily_visitors"
  on public.daily_visitors for insert
  to anon, authenticated
  with check (true);

-- Allow reading daily visitor metrics for analytics
create policy "Allow read daily_visitors"
  on public.daily_visitors for select
  to anon, authenticated
  using (true);

create index if not exists idx_daily_visitors_date on public.daily_visitors(visit_date);
create index if not exists idx_daily_visitors_visitor on public.daily_visitors(visitor_id);

-- 18. PRE-SEEDED VERIFIED TELUGU WATCH SOURCES
-- Pre-seed approved YouTube channel for Pokémon Asia Official (Telugu)
insert into public.approved_youtube_channels (channel_id, channel_name, handle, region, is_active)
values ('UC_jZH5w5iZDk3lWhrHigMZw', 'Pokémon Asia Official (Telugu)', '@PokemonTeluguOfficial', 'IN', true)
on conflict (channel_id) do update set channel_name = excluded.channel_name, handle = excluded.handle, region = excluded.region, is_active = excluded.is_active;

-- Pre-seed 60 Verified Official Telugu Episode Watch Sources
insert into public.watch_sources (
  anime_id, provider, channel_name, channel_id, video_id, episode_number, season_number,
  language, language_status, region, is_official, is_embeddable, match_confidence,
  verification_status, source_url, video_title, thumbnail_url
) values
  (187663, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 's0Dmgxw2EbQ', 1, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=s0Dmgxw2EbQ', '[Telugu Dub] A Gatherer''s Adventure in Isekai - Episode 01 | Muse IN', 'https://img.youtube.com/vi/s0Dmgxw2EbQ/hqdefault.jpg'),
  (187663, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'F9uFHszLq5U', 7, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=F9uFHszLq5U', '[Telugu Dub] A Gatherer''s Adventure in Isekai - Episode 07 | Muse IN', 'https://img.youtube.com/vi/F9uFHszLq5U/hqdefault.jpg'),
  (187663, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'iORgdzUCO2A', 9, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=iORgdzUCO2A', '[Telugu Dub] A Gatherer''s Adventure in Isekai - Episode 09 | Muse IN', 'https://img.youtube.com/vi/iORgdzUCO2A/hqdefault.jpg'),
  (187663, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'HLqoO3YvBes', 11, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=HLqoO3YvBes', '[Telugu Dub] A Gatherer''s Adventure in Isekai - Episode 11 | Muse IN', 'https://img.youtube.com/vi/HLqoO3YvBes/hqdefault.jpg'),
  (16498, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'g4KsydBnM7s', 1, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=g4KsydBnM7s', '[Telugu Dub] Attack on Titan - Episode 01 (S1E01) | Muse IN', 'https://img.youtube.com/vi/g4KsydBnM7s/hqdefault.jpg'),
  (16498, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', '4fc2F--lF5A', 2, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=4fc2F--lF5A', '[Telugu Dub] Attack on Titan - Episode 02 (S1E02) | Muse IN', 'https://img.youtube.com/vi/4fc2F--lF5A/hqdefault.jpg'),
  (16498, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', '8OsbXTOzeWM', 13, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=8OsbXTOzeWM', '[Telugu Dub] Attack on Titan - Episode 13 (S1E13) | Muse IN', 'https://img.youtube.com/vi/8OsbXTOzeWM/hqdefault.jpg'),
  (16498, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'GrmMrkLgP4k', 17, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=GrmMrkLgP4k', '[Telugu Dub] Attack on Titan - Episode 17 (S1E17) | Muse IN', 'https://img.youtube.com/vi/GrmMrkLgP4k/hqdefault.jpg'),
  (16498, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'bd10QvYdrtI', 21, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=bd10QvYdrtI', '[Telugu Dub] Attack on Titan - Episode 21 (S1E21) | Muse IN', 'https://img.youtube.com/vi/bd10QvYdrtI/hqdefault.jpg'),
  (16498, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 't2ZC25bFpI8', 22, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=t2ZC25bFpI8', '[Telugu Dub] Attack on Titan - Episode 22 (S1E22) | Muse IN', 'https://img.youtube.com/vi/t2ZC25bFpI8/hqdefault.jpg'),
  (16498, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'O6cujyFoPNI', 25, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=O6cujyFoPNI', '[Telugu Dub] Attack on Titan - Episode 25 (S1E25) | Muse IN', 'https://img.youtube.com/vi/O6cujyFoPNI/hqdefault.jpg'),
  (16498, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'ahcDPggJPIw', 5, 2, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=ahcDPggJPIw', '[Telugu Dub] Attack on Titan - Episode 30 (S2E05) | Muse IN', 'https://img.youtube.com/vi/ahcDPggJPIw/hqdefault.jpg'),
  (16498, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'eAtRTjaBRIw', 9, 2, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=eAtRTjaBRIw', '[Telugu Dub] Attack on Titan - Episode 34 (S2E09) | Muse IN', 'https://img.youtube.com/vi/eAtRTjaBRIw/hqdefault.jpg'),
  (16498, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'J74gJeDFyDc', 12, 2, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=J74gJeDFyDc', '[Telugu Dub] Attack on Titan - Episode 37 (S2E12) | Muse IN', 'https://img.youtube.com/vi/J74gJeDFyDc/hqdefault.jpg'),
  (21087, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', '0gVu7IsXEoE', 1, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=0gVu7IsXEoE', '[Telugu Dub] One-Punch Man - Episode 01 (S1E01) | Muse IN', 'https://img.youtube.com/vi/0gVu7IsXEoE/hqdefault.jpg'),
  (21087, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'foN6WBElXOo', 4, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=foN6WBElXOo', '[Telugu Dub] One-Punch Man - Episode 04 (S1E04) | Muse IN', 'https://img.youtube.com/vi/foN6WBElXOo/hqdefault.jpg'),
  (21087, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'igZzqhSV5RY', 5, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=igZzqhSV5RY', '[Telugu Dub] One-Punch Man - Episode 05 (S1E05) | Muse IN', 'https://img.youtube.com/vi/igZzqhSV5RY/hqdefault.jpg'),
  (21087, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', '5ngBmY6e2_M', 8, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=5ngBmY6e2_M', '[Telugu Dub] One-Punch Man - Episode 08 (S1E08) | Muse IN', 'https://img.youtube.com/vi/5ngBmY6e2_M/hqdefault.jpg'),
  (21087, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'NwdOWwhig2A', 11, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=NwdOWwhig2A', '[Telugu Dub] One-Punch Man - Episode 11 (S1E11) | Muse IN', 'https://img.youtube.com/vi/NwdOWwhig2A/hqdefault.jpg'),
  (21087, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'uKTVWXnpIxg', 12, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=uKTVWXnpIxg', '[Telugu Dub] One-Punch Man - Episode 12 (S1E12) | Muse IN', 'https://img.youtube.com/vi/uKTVWXnpIxg/hqdefault.jpg'),
  (21087, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'jlih0z0qq28', 5, 2, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=jlih0z0qq28', '[Telugu Dub] One-Punch Man - Episode 17 (S2E05) | Muse IN', 'https://img.youtube.com/vi/jlih0z0qq28/hqdefault.jpg'),
  (21087, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'mA5c0xReUJw', 7, 2, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=mA5c0xReUJw', '[Telugu Dub] One-Punch Man - Episode 19 (S2E07) | Muse IN', 'https://img.youtube.com/vi/mA5c0xReUJw/hqdefault.jpg'),
  (21087, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'JsF3A7wudkE', 2, 3, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=JsF3A7wudkE', '[Telugu Dub] One-Punch Man - Episode 26 (S3E02) | Muse IN', 'https://img.youtube.com/vi/JsF3A7wudkE/hqdefault.jpg'),
  (21087, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'nCCMcOEgEPk', 10, 3, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=nCCMcOEgEPk', '[Telugu Dub] One-Punch Man - Episode 34 (S3E10) | Muse IN', 'https://img.youtube.com/vi/nCCMcOEgEPk/hqdefault.jpg'),
  (98659, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'QbEoZexESDs', 1, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=QbEoZexESDs', '[Telugu Dub] Classroom of the Elite - Episode 01 | Muse IN', 'https://img.youtube.com/vi/QbEoZexESDs/hqdefault.jpg'),
  (98659, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'gU24L5IFJ3c', 10, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=gU24L5IFJ3c', '[Telugu Dub] Classroom of the Elite - Episode 10 | Muse IN', 'https://img.youtube.com/vi/gU24L5IFJ3c/hqdefault.jpg'),
  (98659, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'vNITI_aPWJs', 3, 2, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=vNITI_aPWJs', '[Telugu Dub] Classroom of the Elite Season 2 - Episode 03 | Muse IN', 'https://img.youtube.com/vi/vNITI_aPWJs/hqdefault.jpg'),
  (98659, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'VDyo1ujH1BY', 6, 2, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=VDyo1ujH1BY', '[Telugu Dub] Classroom of the Elite Season 2 - Episode 06 | Muse IN', 'https://img.youtube.com/vi/VDyo1ujH1BY/hqdefault.jpg'),
  (98659, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 't_3pPFBdu9Y', 7, 2, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=t_3pPFBdu9Y', '[Telugu Dub] Classroom of the Elite Season 2 - Episode 07 | Muse IN', 'https://img.youtube.com/vi/t_3pPFBdu9Y/hqdefault.jpg'),
  (98659, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', '05QnYKBDggw', 10, 2, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=05QnYKBDggw', '[Telugu Dub] Classroom of the Elite Season 2 - Episode 10 | Muse IN', 'https://img.youtube.com/vi/05QnYKBDggw/hqdefault.jpg'),
  (98659, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', '5tuh9rNWPWU', 12, 2, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=5tuh9rNWPWU', '[Telugu Dub] Classroom of the Elite Season 2 - Episode 12 | Muse IN', 'https://img.youtube.com/vi/5tuh9rNWPWU/hqdefault.jpg'),
  (98659, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'vBt22eQLwIk', 13, 2, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=vBt22eQLwIk', '[Telugu Dub] Classroom of the Elite Season 2 - Episode 13 | Muse IN', 'https://img.youtube.com/vi/vBt22eQLwIk/hqdefault.jpg'),
  (98659, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'he8pzJTFJ5Y', 5, 3, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=he8pzJTFJ5Y', '[Telugu Dub] Classroom of the Elite Season 3 - Episode 05 | Muse IN', 'https://img.youtube.com/vi/he8pzJTFJ5Y/hqdefault.jpg'),
  (98659, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', '2YltBNwWXSI', 6, 3, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=2YltBNwWXSI', '[Telugu Dub] Classroom of the Elite Season 3 - Episode 06 | Muse IN', 'https://img.youtube.com/vi/2YltBNwWXSI/hqdefault.jpg'),
  (98659, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'vA9Gi78vSeI', 7, 3, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=vA9Gi78vSeI', '[Telugu Dub] Classroom of the Elite Season 3 - Episode 07 | Muse IN', 'https://img.youtube.com/vi/vA9Gi78vSeI/hqdefault.jpg'),
  (98659, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', '8diL300WGmA', 10, 3, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=8diL300WGmA', '[Telugu Dub] Classroom of the Elite Season 3 - Episode 10 | Muse IN', 'https://img.youtube.com/vi/8diL300WGmA/hqdefault.jpg'),
  (98659, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', '5q1ObyClTt0', 12, 3, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=5q1ObyClTt0', '[Telugu Dub] Classroom of the Elite Season 3 - Episode 12 | Muse IN', 'https://img.youtube.com/vi/5q1ObyClTt0/hqdefault.jpg'),
  (98659, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'tgvZMyNMoE4', 13, 3, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=tgvZMyNMoE4', '[Telugu Dub] Classroom of the Elite Season 3 - Episode 13 | Muse IN', 'https://img.youtube.com/vi/tgvZMyNMoE4/hqdefault.jpg'),
  (21507, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'Q8gS7x4hBs0', 1, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=Q8gS7x4hBs0', '[Telugu Dub] Mob Psycho 100 - Episode 01 | Muse IN', 'https://img.youtube.com/vi/Q8gS7x4hBs0/hqdefault.jpg'),
  (21507, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'Dbv5q8XqYyY', 3, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=Dbv5q8XqYyY', '[Telugu Dub] Mob Psycho 100 - Episode 03 | Muse IN', 'https://img.youtube.com/vi/Dbv5q8XqYyY/hqdefault.jpg'),
  (21507, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'cSvLTwtqo2M', 5, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=cSvLTwtqo2M', '[Telugu Dub] Mob Psycho 100 - Episode 05 | Muse IN', 'https://img.youtube.com/vi/cSvLTwtqo2M/hqdefault.jpg'),
  (21507, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'ZSeEnalOK0k', 7, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=ZSeEnalOK0k', '[Telugu Dub] Mob Psycho 100 - Episode 07 | Muse IN', 'https://img.youtube.com/vi/ZSeEnalOK0k/hqdefault.jpg'),
  (21507, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'yGL74jzQapE', 3, 2, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=yGL74jzQapE', '[Telugu Dub] Mob Psycho 100 II - Episode 03 | Muse IN', 'https://img.youtube.com/vi/yGL74jzQapE/hqdefault.jpg'),
  (21507, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'Mb3n60vuGIA', 5, 2, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=Mb3n60vuGIA', '[Telugu Dub] Mob Psycho 100 II - Episode 05 | Muse IN', 'https://img.youtube.com/vi/Mb3n60vuGIA/hqdefault.jpg'),
  (21507, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'nmCCja33Vwc', 6, 2, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=nmCCja33Vwc', '[Telugu Dub] Mob Psycho 100 II - Episode 06 | Muse IN', 'https://img.youtube.com/vi/nmCCja33Vwc/hqdefault.jpg'),
  (21507, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', '8WvHTA9NkkQ', 12, 2, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=8WvHTA9NkkQ', '[Telugu Dub] Mob Psycho 100 II - Episode 12 | Muse IN', 'https://img.youtube.com/vi/8WvHTA9NkkQ/hqdefault.jpg'),
  (21507, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'rPUgHpqIgag', 6, 3, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=rPUgHpqIgag', '[Telugu Dub] Mob Psycho 100 III - Episode 06 | Muse IN', 'https://img.youtube.com/vi/rPUgHpqIgag/hqdefault.jpg'),
  (21507, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'J0gXVrKiwfg', 11, 3, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=J0gXVrKiwfg', '[Telugu Dub] Mob Psycho 100 III - Episode 11 | Muse IN', 'https://img.youtube.com/vi/J0gXVrKiwfg/hqdefault.jpg'),
  (132474, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'r7W8XBaSFbY', 1, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=r7W8XBaSFbY', '[Telugu Dub] Skeleton Knight in Another World | Episode 01 (S1E01) | Muse IN', 'https://img.youtube.com/vi/r7W8XBaSFbY/hqdefault.jpg'),
  (132474, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'Sv-IoqC2-6g', 2, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=Sv-IoqC2-6g', '[Telugu Dub] Skeleton Knight in Another World | Episode 02 (S1E02) | Muse IN', 'https://img.youtube.com/vi/Sv-IoqC2-6g/hqdefault.jpg'),
  (132474, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', '2wfXdY0CGJQ', 6, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=2wfXdY0CGJQ', '[Telugu Dub] Skeleton Knight in Another World | Episode 06 (S1E06) | Muse IN', 'https://img.youtube.com/vi/2wfXdY0CGJQ/hqdefault.jpg'),
  (132474, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'ihL4_G-RETI', 7, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=ihL4_G-RETI', '[Telugu Dub] Skeleton Knight in Another World | Episode 07 (S1E07) | Muse IN', 'https://img.youtube.com/vi/ihL4_G-RETI/hqdefault.jpg'),
  (132474, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'DudH1w8aUyM', 10, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=DudH1w8aUyM', '[Telugu Dub] Skeleton Knight in Another World | Episode 10 (S1E10) | Muse IN', 'https://img.youtube.com/vi/DudH1w8aUyM/hqdefault.jpg'),
  (132474, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', '-_VCkVezUkA', 12, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=-_VCkVezUkA', '[Telugu Dub] Skeleton Knight in Another World | Episode 12 (S1E12) | Muse IN', 'https://img.youtube.com/vi/-_VCkVezUkA/hqdefault.jpg'),
  (156067, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', '21sCfzLOeeg', 3, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=21sCfzLOeeg', '[Telugu Dub] Campfire Cooking in Another World - Episode 03 (S1E03) | Muse IN', 'https://img.youtube.com/vi/21sCfzLOeeg/hqdefault.jpg'),
  (156067, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'K8XSK3HvmhM', 7, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=K8XSK3HvmhM', '[Telugu Dub] Campfire Cooking in Another World - Episode 07 (S1E07) | Muse IN', 'https://img.youtube.com/vi/K8XSK3HvmhM/hqdefault.jpg'),
  (156067, 'youtube', 'Muse India', 'UCYYhAzgWuxPauRXdPpLAX3Q', 'ob89Omm1FBQ', 8, 1, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=ob89Omm1FBQ', '[Telugu Dub] Campfire Cooking in Another World - Episode 08 (S1E08) | Muse IN', 'https://img.youtube.com/vi/ob89Omm1FBQ/hqdefault.jpg'),
  (1565, 'youtube', 'Pokémon Asia Official (Telugu)', 'UC_jZH5w5iZDk3lWhrHigMZw', 'qDeAYUbFw10', 7, 11, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=qDeAYUbFw10', 'Pokémon: Diamond and Pearl: Battle Dimension | ఎపిసోడ్ 7 | Pokémon Asia Official (Telugu)', 'https://img.youtube.com/vi/qDeAYUbFw10/hqdefault.jpg'),
  (19291, 'youtube', 'Pokémon Asia Official (Telugu)', 'UC_jZH5w5iZDk3lWhrHigMZw', 'JaHTm7c7lsE', 7, 17, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=JaHTm7c7lsE', 'Pokémon the Series: XY భాగం 7 | Giving Chase At The Rhyhorn Race! | Pokémon Asia Official (Telugu)', 'https://img.youtube.com/vi/JaHTm7c7lsE/hqdefault.jpg'),
  (112153, 'youtube', 'Pokémon Asia Official (Telugu)', 'UC_jZH5w5iZDk3lWhrHigMZw', 't41KDkKaaqU', 27, 25, 'Telugu', 'verified', 'IN', true, true, 1.0, 'verified', 'https://www.youtube.com/watch?v=t41KDkKaaqU', 'Pokémon Ultimate Journeys | భాగం 27 | Pokémon Asia Official (Telugu)', 'https://img.youtube.com/vi/t41KDkKaaqU/hqdefault.jpg')
on conflict (anime_id, provider, season_number, episode_number, video_id) do update set
  channel_name = excluded.channel_name,
  channel_id = excluded.channel_id,
  language = excluded.language,
  language_status = excluded.language_status,
  region = excluded.region,
  is_official = excluded.is_official,
  is_embeddable = excluded.is_embeddable,
  verification_status = excluded.verification_status,
  source_url = excluded.source_url,
  video_title = excluded.video_title,
  thumbnail_url = excluded.thumbnail_url;

