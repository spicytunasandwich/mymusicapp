package com.audira.music.ui;

import android.app.AlertDialog;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.audira.music.R;
import com.audira.music.api.ApiClient;
import com.audira.music.api.ApiService;
import com.audira.music.models.Track;
import com.audira.music.player.AudiraPlayerManager;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.reflect.TypeToken;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class LibraryFragment extends Fragment {

    private TextView tvLikedCount;
    private View btnSpotifyImport, btnOpenLikedSongs;
    private ApiService apiService;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_library, container, false);

        tvLikedCount = view.findViewById(R.id.tvLikedCount);
        btnSpotifyImport = view.findViewById(R.id.btnSpotifyImport);
        btnOpenLikedSongs = view.findViewById(R.id.btnOpenLikedSongs);

        apiService = ApiClient.getService(requireContext());

        btnSpotifyImport.setOnClickListener(v -> showSpotifyImportDialog());
        btnOpenLikedSongs.setOnClickListener(v -> playLikedSongs());

        loadLibraryOverview();
        return view;
    }

    private void loadLibraryOverview() {
        apiService.getLibrary().enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                if (response.isSuccessful() && response.body() != null) {
                    int likedCount = response.body().get("liked_songs_count").getAsInt();
                    tvLikedCount.setText(likedCount + " tracks");
                }
            }
            @Override public void onFailure(Call<JsonObject> call, Throwable t) {}
        });
    }

    private void playLikedSongs() {
        apiService.getLikedSongs().enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                if (response.isSuccessful() && response.body() != null) {
                    JsonArray tracksJson = response.body().getAsJsonArray("tracks");
                    if (tracksJson != null && tracksJson.size() > 0) {
                        Type listType = new TypeToken<List<Track>>() {}.getType();
                        List<Track> tracks = new Gson().fromJson(tracksJson, listType);
                        AudiraPlayerManager.getInstance(getContext()).playTrack(tracks.get(0), tracks);
                    } else {
                        Toast.makeText(getContext(), "No liked songs yet!", Toast.LENGTH_SHORT).show();
                    }
                }
            }
            @Override public void onFailure(Call<JsonObject> call, Throwable t) {}
        });
    }

    private void showSpotifyImportDialog() {
        final EditText input = new EditText(getContext());
        input.setHint("Paste Spotify Playlist URL");

        new AlertDialog.Builder(getContext())
            .setTitle("Import Spotify Playlist")
            .setMessage("Paste any public Spotify playlist URL to match tracks into your Audira library.")
            .setView(input)
            .setPositiveButton("Import", (dialog, which) -> {
                String url = input.getText().toString().trim();
                if (url.isEmpty()) return;

                Map<String, String> body = new HashMap<>();
                body.put("playlistUrl", url);

                Toast.makeText(getContext(), "Importing Spotify playlist...", Toast.LENGTH_SHORT).show();
                apiService.importSpotify(body).enqueue(new Callback<JsonObject>() {
                    @Override
                    public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                        if (response.isSuccessful() && response.body() != null) {
                            String msg = response.body().get("message").getAsString();
                            Toast.makeText(getContext(), msg, Toast.LENGTH_LONG).show();
                            loadLibraryOverview();
                        } else {
                            Toast.makeText(getContext(), "Failed to import playlist.", Toast.LENGTH_SHORT).show();
                        }
                    }
                    @Override public void onFailure(Call<JsonObject> call, Throwable t) {
                        Toast.makeText(getContext(), "Error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                    }
                });
            })
            .setNegativeButton("Cancel", null)
            .show();
    }
}
