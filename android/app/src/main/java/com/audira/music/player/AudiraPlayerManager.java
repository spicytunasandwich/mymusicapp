package com.audira.music.player;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import androidx.media3.common.MediaItem;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;
import com.audira.music.models.Track;

import java.util.ArrayList;
import java.util.List;

public class AudiraPlayerManager {
    private static AudiraPlayerManager instance;
    private final ExoPlayer exoPlayer;
    private final Handler progressHandler = new Handler(Looper.getMainLooper());
    private final List<PlayerListener> listeners = new ArrayList<>();

    private Track currentTrack;
    private List<Track> currentQueue = new ArrayList<>();
    private int currentIndex = -1;

    public interface PlayerListener {
        void onTrackChanged(Track track);
        void onPlaybackStateChanged(boolean isPlaying);
        void onProgressUpdate(long positionMs, long durationMs);
    }

    private AudiraPlayerManager(Context context) {
        exoPlayer = new ExoPlayer.Builder(context.getApplicationContext()).build();
        exoPlayer.addListener(new Player.Listener() {
            @Override
            public void onIsPlayingChanged(boolean isPlaying) {
                notifyPlaybackStateChanged(isPlaying);
                if (isPlaying) startProgressUpdater();
                else stopProgressUpdater();
            }

            @Override
            public void onPlaybackStateChanged(int state) {
                if (state == Player.STATE_ENDED) {
                    skipToNext();
                }
            }
        });
    }

    public static synchronized AudiraPlayerManager getInstance(Context context) {
        if (instance == null) {
            instance = new AudiraPlayerManager(context);
        }
        return instance;
    }

    public ExoPlayer getExoPlayer() {
        return exoPlayer;
    }

    public void addListener(PlayerListener listener) {
        if (!listeners.contains(listener)) listeners.add(listener);
    }

    public void removeListener(PlayerListener listener) {
        listeners.remove(listener);
    }

    public void playTrack(Track track, List<Track> queue) {
        if (track == null) return;
        this.currentTrack = track;
        if (queue != null) {
            this.currentQueue = new ArrayList<>(queue);
            this.currentIndex = currentQueue.indexOf(track);
        }

        String streamUrl = track.getAudioUrl();
        if (streamUrl != null && !streamUrl.startsWith("http")) {
            streamUrl = "http://10.0.2.2:5000/api/v1/music/tracks/" + track.getId() + "/stream";
        }

        MediaItem mediaItem = MediaItem.fromUri(streamUrl);
        exoPlayer.setMediaItem(mediaItem);
        exoPlayer.prepare();
        exoPlayer.play();

        notifyTrackChanged(track);
    }

    public void togglePlayPause() {
        if (exoPlayer.isPlaying()) {
            exoPlayer.pause();
        } else {
            exoPlayer.play();
        }
    }

    public void seekTo(long positionMs) {
        exoPlayer.seekTo(positionMs);
    }

    public void skipToNext() {
        if (currentQueue.isEmpty() || currentIndex == -1) return;
        int nextIndex = currentIndex + 1;
        if (nextIndex < currentQueue.size()) {
            currentIndex = nextIndex;
            playTrack(currentQueue.get(currentIndex), currentQueue);
        }
    }

    public void skipToPrevious() {
        if (exoPlayer.getCurrentPosition() > 3000) {
            seekTo(0);
            return;
        }
        if (currentIndex > 0) {
            currentIndex--;
            playTrack(currentQueue.get(currentIndex), currentQueue);
        } else {
            seekTo(0);
        }
    }

    public Track getCurrentTrack() { return currentTrack; }
    public boolean isPlaying() { return exoPlayer.isPlaying(); }
    public long getCurrentPosition() { return exoPlayer.getCurrentPosition(); }
    public long getDuration() { return exoPlayer.getDuration(); }

    private void notifyTrackChanged(Track track) {
        for (PlayerListener l : listeners) l.onTrackChanged(track);
    }

    private void notifyPlaybackStateChanged(boolean isPlaying) {
        for (PlayerListener l : listeners) l.onPlaybackStateChanged(isPlaying);
    }

    private final Runnable progressRunnable = new Runnable() {
        @Override
        public void run() {
            if (exoPlayer.isPlaying()) {
                long pos = exoPlayer.getCurrentPosition();
                long dur = exoPlayer.getDuration();
                for (PlayerListener l : listeners) l.onProgressUpdate(pos, dur);
                progressHandler.postDelayed(this, 300);
            }
        }
    };

    private void startProgressUpdater() {
        progressHandler.removeCallbacks(progressRunnable);
        progressHandler.post(progressRunnable);
    }

    private void stopProgressUpdater() {
        progressHandler.removeCallbacks(progressRunnable);
    }
}
