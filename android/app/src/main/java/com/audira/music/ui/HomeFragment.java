package com.audira.music.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.audira.music.R;
import com.audira.music.api.ApiClient;
import com.audira.music.api.ApiService;
import com.audira.music.models.Track;
import com.audira.music.player.AudiraPlayerManager;
import com.audira.music.ui.adapters.TrackAdapter;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.reflect.TypeToken;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

public class HomeFragment extends Fragment {

    private TextView tvGreeting;
    private RecyclerView rvTopTracks;
    private TrackAdapter trackAdapter;
    private ApiService apiService;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_home, container, false);

        tvGreeting = view.findViewById(R.id.tvGreeting);
        rvTopTracks = view.findViewById(R.id.rvTopTracks);

        rvTopTracks.setLayoutManager(new LinearLayoutManager(getContext()));
        trackAdapter = new TrackAdapter(getContext(), new ArrayList<>(), (track, queue) -> {
            AudiraPlayerManager.getInstance(getContext()).playTrack(track, queue);
        });
        rvTopTracks.setAdapter(trackAdapter);

        setGreeting();
        apiService = ApiClient.getService(requireContext());
        loadHomeFeed();

        return view;
    }

    private void setGreeting() {
        int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        if (hour < 12) tvGreeting.setText("Good morning");
        else if (hour < 18) tvGreeting.setText("Good afternoon");
        else tvGreeting.setText("Good evening");
    }

    private void loadHomeFeed() {
        apiService.getHomeFeed().enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                if (response.isSuccessful() && response.body() != null) {
                    JsonArray tracksJson = response.body().getAsJsonArray("top_tracks");
                    if (tracksJson != null) {
                        Type listType = new TypeToken<List<Track>>() {}.getType();
                        List<Track> tracks = new Gson().fromJson(tracksJson, listType);
                        trackAdapter.updateTracks(tracks);
                    }
                }
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {}
        });
    }
}
