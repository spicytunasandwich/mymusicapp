package com.audira.music.ui;

import android.os.Bundle;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.SeekBar;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.audira.music.R;
import com.audira.music.api.ApiClient;
import com.audira.music.api.ApiService;
import com.audira.music.models.Track;
import com.audira.music.player.AudiraPlayerManager;
import com.audira.music.ui.adapters.LyricsAdapter;
import com.bumptech.glide.Glide;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

import java.util.ArrayList;
import java.util.List;

public class NowPlayingActivity extends AppCompatActivity implements AudiraPlayerManager.PlayerListener {

    private AudiraPlayerManager playerManager;
    private ApiService apiService;

    private ImageView imgCover;
    private TextView tvTitle, tvArtist, tvCurrentTime, tvTotalDuration;
    private ImageButton btnPlayPause, btnNext, btnPrevious, btnCollapse, btnLike;
    private SeekBar seekBar;
    private RecyclerView rvLyrics;
    private LyricsAdapter lyricsAdapter;
    private LinearLayoutManager lyricsLayoutManager;

    private List<LyricsAdapter.LyricLine> lyricLines = new ArrayList<>();
    private boolean isUserSeeking = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_now_playing);

        playerManager = AudiraPlayerManager.getInstance(this);
        apiService = ApiClient.getService(this);

        initViews();
        setupLyricsRecycler();
        updateTrackUI(playerManager.getCurrentTrack());
    }

    private void initViews() {
        imgCover = findViewById(R.id.imgNowPlayingCover);
        tvTitle = findViewById(R.id.tvNowPlayingTitle);
        tvArtist = findViewById(R.id.tvNowPlayingArtist);
        tvCurrentTime = findViewById(R.id.tvCurrentTime);
        tvTotalDuration = findViewById(R.id.tvTotalDuration);
        btnPlayPause = findViewById(R.id.btnPlayPause);
        btnNext = findViewById(R.id.btnNext);
        btnPrevious = findViewById(R.id.btnPrevious);
        btnCollapse = findViewById(R.id.btnCollapse);
        btnLike = findViewById(R.id.btnLikeSong);
        seekBar = findViewById(R.id.seekBar);

        btnCollapse.setOnClickListener(v -> finish());
        btnPlayPause.setOnClickListener(v -> playerManager.togglePlayPause());
        btnNext.setOnClickListener(v -> playerManager.skipToNext());
        btnPrevious.setOnClickListener(v -> playerManager.skipToPrevious());

        seekBar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar sb, int progress, boolean fromUser) {
                if (fromUser) {
                    tvCurrentTime.setText(formatTime(progress));
                }
            }
            @Override
            public void onStartTrackingTouch(SeekBar sb) { isUserSeeking = true; }
            @Override
            public void onStopTrackingTouch(SeekBar sb) {
                isUserSeeking = false;
                playerManager.seekTo(sb.getProgress());
            }
        });
    }

    private void setupLyricsRecycler() {
        rvLyrics = findViewById(R.id.rvLyrics);
        lyricsLayoutManager = new LinearLayoutManager(this);
        rvLyrics.setLayoutManager(lyricsLayoutManager);
        lyricsAdapter = new LyricsAdapter(this);
        rvLyrics.setAdapter(lyricsAdapter);
    }

    private void updateTrackUI(Track track) {
        if (track == null) return;
        tvTitle.setText(track.getTitle());
        tvArtist.setText(track.getArtistName());

        if (track.getCoverUrl() != null && !track.getCoverUrl().isEmpty()) {
            Glide.with(this).load(track.getCoverUrl()).centerCrop().into(imgCover);
        }

        loadLyrics(track.getId());
    }

    private void loadLyrics(String trackId) {
        apiService.getTrackLyrics(trackId).enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                if (response.isSuccessful() && response.body() != null) {
                    JsonObject body = response.body();
                    JsonArray linesArr = body.getAsJsonArray("lines");
                    List<LyricsAdapter.LyricLine> parsed = new ArrayList<>();

                    if (linesArr != null) {
                        for (JsonElement el : linesArr) {
                            JsonObject item = el.getAsJsonObject();
                            long timeMs = item.has("timeMs") && !item.get("timeMs").isJsonNull()
                                ? item.get("timeMs").getAsLong() : -1;
                            String text = item.get("text").getAsString();
                            parsed.add(new LyricsAdapter.LyricLine(timeMs, text));
                        }
                    }
                    lyricLines = parsed;
                    lyricsAdapter.setLines(lyricLines);
                }
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {}
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        playerManager.addListener(this);
        onPlaybackStateChanged(playerManager.isPlaying());
    }

    @Override
    protected void onPause() {
        super.onPause();
        playerManager.removeListener(this);
    }

    @Override
    public void onTrackChanged(Track track) {
        runOnUiThread(() -> updateTrackUI(track));
    }

    @Override
    public void onPlaybackStateChanged(boolean isPlaying) {
        runOnUiThread(() -> {
            btnPlayPause.setImageResource(
                isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play
            );
        });
    }

    @Override
    public void onProgressUpdate(long positionMs, long durationMs) {
        runOnUiThread(() -> {
            if (!isUserSeeking && durationMs > 0) {
                seekBar.setMax((int) durationMs);
                seekBar.setProgress((int) positionMs);
                tvCurrentTime.setText(formatTime(positionMs));
                tvTotalDuration.setText(formatTime(durationMs));
            }

            // Sync karaoke lyric scroll
            if (!lyricLines.isEmpty()) {
                int activeIdx = -1;
                for (int i = 0; i < lyricLines.size(); i++) {
                    if (lyricLines.get(i).timeMs <= positionMs) {
                        activeIdx = i;
                    } else break;
                }
                if (activeIdx != -1) {
                    lyricsAdapter.setActiveIndex(activeIdx);
                    lyricsLayoutManager.scrollToPositionWithOffset(activeIdx, rvLyrics.getHeight() / 2 - 30);
                }
            }
        });
    }

    private String formatTime(long ms) {
        long totalSecs = ms / 1000;
        long mins = totalSecs / 60;
        long secs = totalSecs % 60;
        return String.format("%d:%02d", mins, secs);
    }
}
