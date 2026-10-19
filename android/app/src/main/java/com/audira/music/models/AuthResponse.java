package com.audira.music.models;

public class AuthResponse {
    private String message;
    private String token;
    private User user;
    private String error;

    public String getMessage() { return message; }
    public String getToken() { return token; }
    public User getUser() { return user; }
    public String getError() { return error; }
}
