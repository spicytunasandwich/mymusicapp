package com.audira.music.models;

import java.io.Serializable;

public class Track implements Serializable {
    private String id;
    private String title;
    private String artist_id;
    private String artist_name;
    private String album_id;
    private String album_title;
    private int duration;
    private String audio_url;
    private String cover_url;
    private boolean is_liked;

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getArtistName() { return artist_name != null ? artist_name : "Audira Artist"; }
    public String getAlbumTitle() { return album_title; }
    public int getDuration() { return duration; }
    public String getAudioUrl() { return audio_url; }
    public String getCoverUrl() { return cover_url; }
    public boolean isLiked() { return is_liked; }
    public void setLiked(boolean liked) { this.is_liked = liked; }
}
