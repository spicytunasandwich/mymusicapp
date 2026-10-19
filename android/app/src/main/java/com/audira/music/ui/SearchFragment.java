package com.audira.music.ui;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.ProgressBar;
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
import java.util.List;

public class SearchFragment extends Fragment {

    private EditText etSearchQuery;
    private ProgressBar searchProgressBar;
    private RecyclerView rvSearchResults;
    private TrackAdapter trackAdapter;
    private ApiService apiService;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_search, container, false);

        etSearchQuery = view.findViewById(R.id.etSearchQuery);
        searchProgressBar = view.findViewById(R.id.searchProgressBar);
        rvSearchResults = view.findViewById(R.id.rvSearchResults);

        rvSearchResults.setLayoutManager(new LinearLayoutManager(getContext()));
        trackAdapter = new TrackAdapter(getContext(), new ArrayList<>(), (track, queue) -> {
            AudiraPlayerManager.getInstance(getContext()).playTrack(track, queue);
        });
        rvSearchResults.setAdapter(trackAdapter);

        apiService = ApiClient.getService(requireContext());

        etSearchQuery.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {
                String query = s.toString().trim();
                if (!query.isEmpty()) {
                    performSearch(query);
                } else {
                    trackAdapter.updateTracks(new ArrayList<>());
                }
            }
            @Override public void afterTextChanged(Editable s) {}
        });

        return view;
    }

    private void performSearch(String query) {
        searchProgressBar.setVisibility(View.VISIBLE);
        apiService.search(query).enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                searchProgressBar.setVisibility(View.GONE);
                if (response.isSuccessful() && response.body() != null) {
                    JsonArray tracksJson = response.body().getAsJsonArray("tracks");
                    if (tracksJson != null) {
                        Type listType = new TypeToken<List<Track>>() {}.getType();
                        List<Track> tracks = new Gson().fromJson(tracksJson, listType);
                        trackAdapter.updateTracks(tracks);
                    }
                }
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                searchProgressBar.setVisibility(View.GONE);
            }
        });
    }
}
