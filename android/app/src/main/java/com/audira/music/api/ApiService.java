package com.audira.music.api;

import com.audira.music.models.AuthResponse;
import com.audira.music.models.LoginRequest;
import com.audira.music.models.SignupRequest;
import com.audira.music.models.Track;
import com.google.gson.JsonObject;

import java.util.Map;
import retrofit2.Call;
import retrofit2.http.*;

public interface ApiService {

    // Auth
    @POST("auth/login")
    Call<AuthResponse> login(@Body LoginRequest request);

    @POST("auth/signup")
    Call<AuthResponse> signup(@Body SignupRequest request);

    @GET("auth/me")
    Call<JsonObject> getMe();

    // Music
    @GET("music/home")
    Call<JsonObject> getHomeFeed();

    @GET("music/search")
    Call<JsonObject> search(@Query("q") String query);

    @GET("music/tracks/{id}")
    Call<JsonObject> getTrackById(@Path("id") String id);

    @GET("music/tracks/{id}/lyrics")
    Call<JsonObject> getTrackLyrics(@Path("id") String id);

    // Library
    @GET("library")
    Call<JsonObject> getLibrary();

    @GET("library/likes")
    Call<JsonObject> getLikedSongs();

    @POST("library/likes/{id}")
    Call<JsonObject> toggleLikeSong(@Path("id") String trackId);

    @POST("library/playlists")
    Call<JsonObject> createPlaylist(@Body Map<String, String> body);

    @GET("library/playlists/{id}")
    Call<JsonObject> getPlaylistById(@Path("id") String id);

    // Spotify Import
    @POST("import/spotify")
    Call<JsonObject> importSpotify(@Body Map<String, String> body);

    // Profile & Settings
    @GET("users/profile/{username}")
    Call<JsonObject> getProfile(@Path("username") String username);

    @PATCH("users/profile")
    Call<JsonObject> updateProfile(@Body Map<String, Object> body);

    @GET("users/settings")
    Call<JsonObject> getSettings();

    @PATCH("users/settings")
    Call<JsonObject> updateSettings(@Body Map<String, Object> body);
}
