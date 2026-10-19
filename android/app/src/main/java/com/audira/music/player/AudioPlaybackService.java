package com.audira.music.player;

import android.content.Intent;
import androidx.annotation.Nullable;
import androidx.media3.session.MediaSession;
import androidx.media3.session.MediaSessionService;

public class AudioPlaybackService extends MediaSessionService {
    private MediaSession mediaSession = null;

    @Override
    public void onCreate() {
        super.onCreate();
        AudiraPlayerManager playerManager = AudiraPlayerManager.getInstance(this);
        mediaSession = new MediaSession.Builder(this, playerManager.getExoPlayer()).build();
    }

    @Nullable
    @Override
    public MediaSession onGetSession(MediaSession.ControllerInfo controllerInfo) {
        return mediaSession;
    }

    @Override
    public void onDestroy() {
        if (mediaSession != null) {
            mediaSession.getPlayer().release();
            mediaSession.release();
            mediaSession = null;
        }
        super.onDestroy();
    }
}
