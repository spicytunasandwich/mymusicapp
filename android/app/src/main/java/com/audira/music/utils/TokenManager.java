package com.audira.music.utils;

import android.content.Context;
import android.content.SharedPreferences;
import com.audira.music.models.User;
import com.google.gson.Gson;

public class TokenManager {
    private static final String PREF_NAME = "audira_prefs";
    private static final String KEY_TOKEN = "jwt_token";
    private static final String KEY_USER = "current_user";

    private final SharedPreferences prefs;
    private final Gson gson;

    public TokenManager(Context context) {
        this.prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        this.gson = new Gson();
    }

    public void saveSession(String token, User user) {
        prefs.edit()
             .putString(KEY_TOKEN, token)
             .putString(KEY_USER, gson.toJson(user))
             .apply();
    }

    public String getToken() {
        return prefs.getString(KEY_TOKEN, null);
    }

    public User getUser() {
        String json = prefs.getString(KEY_USER, null);
        return json != null ? gson.fromJson(json, User.class) : null;
    }

    public boolean isLoggedIn() {
        return getToken() != null;
    }

    public void clear() {
        prefs.edit().clear().apply();
    }
}
