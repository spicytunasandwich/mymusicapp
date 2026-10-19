package com.audira.music.ui;

import android.os.Bundle;
import android.view.View;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import com.audira.music.R;
import com.audira.music.models.Track;
import com.audira.music.player.AudiraPlayerManager;
import com.bumptech.glide.Glide;
import com.google.android.material.bottomnavigation.BottomNavigationView;

public class MainActivity extends AppCompatActivity implements AudiraPlayerManager.PlayerListener {

    private AudiraPlayerManager playerManager;
    private View miniPlayerLayout;
    private ImageView imgMiniCover;
    private TextView tvMiniTitle, tvMiniArtist;
    private ImageButton btnMiniPlayPause;
    private ProgressBar miniProgressBar;
    private BottomNavigationView bottomNavigationView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        playerManager = AudiraPlayerManager.getInstance(this);

        initViews();
        setupBottomNav();
    }

    private void initViews() {
        miniPlayerLayout = findViewById(R.id.miniPlayerLayout);
        imgMiniCover = findViewById(R.id.imgMiniCover);
        tvMiniTitle = findViewById(R.id.tvMiniTitle);
        tvMiniArtist = findViewById(R.id.tvMiniArtist);
        btnMiniPlayPause = findViewById(R.id.btnMiniPlayPause);
        miniProgressBar = findViewById(R.id.miniProgressBar);
        bottomNavigationView = findViewById(R.id.bottomNavigationView);

        miniPlayerLayout.setOnClickListener(v -> {
            startActivity(new android.content.Intent(this, NowPlayingActivity.class));
        });

        btnMiniPlayPause.setOnClickListener(v -> playerManager.togglePlayPause());

        // Initial default screen
        loadFragment(new HomeFragment());

        Track current = playerManager.getCurrentTrack();
        if (current != null) {
            onTrackChanged(current);
            onPlaybackStateChanged(playerManager.isPlaying());
        }
    }

    private void setupBottomNav() {
        bottomNavigationView.setOnItemSelectedListener(item -> {
            int id = item.getItemId();
            if (id == R.id.nav_home) {
                loadFragment(new HomeFragment());
                return true;
            } else if (id == R.id.nav_search) {
                loadFragment(new SearchFragment());
                return true;
            } else if (id == R.id.nav_library) {
                loadFragment(new LibraryFragment());
                return true;
            } else if (id == R.id.nav_profile) {
                loadFragment(new ProfileFragment());
                return true;
            }
            return false;
        });
    }

    private void loadFragment(androidx.fragment.app.Fragment fragment) {
        getSupportFragmentManager().beginTransaction()
            .replace(R.id.fragment_container, fragment)
            .commit();
    }

    @Override
    protected void onResume() {
        super.onResume();
        playerManager.addListener(this);
    }

    @Override
    protected void onPause() {
        super.onPause();
        playerManager.removeListener(this);
    }

    @Override
    public void onTrackChanged(Track track) {
        runOnUiThread(() -> {
            if (track == null) {
                miniPlayerLayout.setVisibility(View.GONE);
                return;
            }

            miniPlayerLayout.setVisibility(View.VISIBLE);
            tvMiniTitle.setText(track.getTitle());
            tvMiniArtist.setText(track.getArtistName());

            if (track.getCoverUrl() != null && !track.getCoverUrl().isEmpty()) {
                Glide.with(this)
                     .load(track.getCoverUrl())
                     .centerCrop()
                     .into(imgMiniCover);
            }
        });
    }

    @Override
    public void onPlaybackStateChanged(boolean isPlaying) {
        runOnUiThread(() -> {
            btnMiniPlayPause.setImageResource(
                isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play
            );
        });
    }

    @Override
    public void onProgressUpdate(long positionMs, long durationMs) {
        runOnUiThread(() -> {
            if (durationMs > 0) {
                int progress = (int) ((positionMs * 100) / durationMs);
                miniProgressBar.setProgress(progress);
            }
        });
    }
}
