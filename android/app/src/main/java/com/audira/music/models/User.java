package com.audira.music.models;

import java.io.Serializable;

public class User implements Serializable {
    private String id;
    private String email;
    private String username;
    private String display_name;
    private String bio;
    private String avatar_url;
    private String banner_url;
    private String accent_color;
    private boolean is_verified;

    public String getId() { return id; }
    public String getEmail() { return email; }
    public String getUsername() { return username; }
    public String getDisplayName() { return display_name != null ? display_name : username; }
    public String getBio() { return bio; }
    public String getAvatarUrl() { return avatar_url; }
    public String getBannerUrl() { return banner_url; }
    public String getAccentColor() { return accent_color != null ? accent_color : "#8B5CF6"; }
    public boolean isVerified() { return is_verified; }
}
