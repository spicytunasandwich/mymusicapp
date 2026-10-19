package com.audira.music.models;

public class SignupRequest {
    private String email;
    private String password;
    private String username;
    private String display_name;

    public SignupRequest(String email, String password, String username, String displayName) {
        this.email = email;
        this.password = password;
        this.username = username;
        this.display_name = displayName;
    }
}
