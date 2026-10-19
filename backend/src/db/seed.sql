-- Seed Genres
INSERT INTO genres (id, name, slug, cover_color) VALUES
(1, 'Electronic & Synth', 'electronic', '#6366F1'),
(2, 'Lo-Fi Chill', 'lofi', '#EC4899'),
(3, 'Pop & Modern', 'pop', '#F59E0B'),
(4, 'Rock & Alternative', 'rock', '#EF4444'),
(5, 'Hip-Hop & R&B', 'hip-hop', '#8B5CF6'),
(6, 'Ambient & Classical', 'ambient', '#10B981')
ON CONFLICT (id) DO NOTHING;

-- Seed Artists
INSERT INTO artists (id, name, bio, avatar_url, banner_url, verified, monthly_listeners) VALUES
('11111111-1111-1111-1111-111111111111', 'Aura Nova', 'Pioneer of atmospheric electronic and cinematic future bass soundscapes.', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600', true, 1254300),
('22222222-2222-2222-2222-222222222222', 'Neon Pulse', 'Retro-futuristic synthwave duo blending 80s analog synthesizers with modern beats.', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1600', true, 894000),
('33333333-3333-3333-3333-333333333333', 'Komorebi Sound', 'Lo-Fi beats producer from Tokyo. Perfect background music for late night coding and study.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600', true, 2100500)
ON CONFLICT (id) DO NOTHING;

-- Seed Albums
INSERT INTO albums (id, artist_id, title, release_year, cover_url, album_type, total_tracks) VALUES
('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', 'Celestial Horizons', 2025, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600', 'album', 2),
('44444444-4444-4444-4444-444444444442', '22222222-2222-2222-2222-222222222222', 'Midnight Drive', 2024, 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600', 'album', 2),
('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333333', 'Coffee & Raindrops', 2025, 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600', 'ep', 2)
ON CONFLICT (id) DO NOTHING;

-- Seed Tracks with Synced LRC Lyrics & Public Sample MP3 Streams
INSERT INTO tracks (id, title, artist_id, album_id, duration, audio_url, cover_url, lyrics_lrc, stream_count, is_explicit) VALUES
(
  '55555555-5555-5555-5555-555555555551',
  'Starlight Echoes',
  '11111111-1111-1111-1111-111111111111',
  '44444444-4444-4444-4444-444444444441',
  214,
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600',
  '[00:00.00] (Instrumental Intro)
[00:15.50] Floating through the quiet space tonight
[00:23.20] Chasing signals in the fading light
[00:31.00] Gravity releases every hold
[00:38.50] Watch the distant galaxies unfold
[00:46.00] Echoes of a star that shines alone
[00:53.80] Guided by a beacon far from home
[01:01.40] Electric pulse running through my veins
[01:09.10] Washing off the memory of rain
[01:17.00] (Synth Solo)
[01:32.40] We are wandering across the edge
[01:40.00] Kept alive by an eternal pledge
[01:47.80] Starlight echoes call my name again
[01:55.60] In a universe without an end',
  482000,
  false
),
(
  '55555555-5555-5555-5555-555555555552',
  'Solar Flare',
  '11111111-1111-1111-1111-111111111111',
  '44444444-4444-4444-4444-444444444441',
  185,
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600',
  '[00:00.00] (Drum buildup)
[00:12.00] Igniting fire in the midnight cold
[00:19.40] A story burning brighter to be told
[00:26.90] Feel the heat against the solar wind
[00:34.20] That is where the journey will begin
[00:42.00] Radiant and fierce across the sky
[00:49.50] Higher than the satellites can fly',
  310500,
  false
),
(
  '55555555-5555-5555-5555-555555555553',
  'Cyber Sunset',
  '22222222-2222-2222-2222-222222222222',
  '44444444-4444-4444-4444-444444444442',
  230,
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600',
  '[00:00.00] (Analog Synth Arpeggio)
[00:18.00] Chrome reflection on the empty road
[00:26.50] Digital horizon taking all the load
[00:35.00] Neon pink fading into deep dark blue
[00:43.70] Speeding through the boulevard with you
[00:52.00] Cyber sunset never dies away
[01:00.50] Keeping darkness permanently at bay',
  645000,
  false
),
(
  '55555555-5555-5555-5555-555555555554',
  'Rainy Tokyo Alley',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444443',
  160,
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600',
  '[00:00.00] (Vinyl crackle and gentle piano)
[00:14.00] Steam rising from the ramen stand
[00:28.00] Droplets drumming on a paper fan
[00:42.00] Gentle chords to ease the busy mind
[00:56.00] Leaving all the noisy streets behind',
  980000,
  false
)
ON CONFLICT (id) DO NOTHING;

-- Link Track to Genres
INSERT INTO track_genres (track_id, genre_id) VALUES
('55555555-5555-5555-5555-555555555551', 1),
('55555555-5555-5555-5555-555555555552', 1),
('55555555-5555-5555-5555-555555555553', 1),
('55555555-5555-5555-5555-555555555554', 2)
ON CONFLICT (track_id, genre_id) DO NOTHING;
