package com.audira.music.ui.adapters;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.audira.music.R;
import com.audira.music.models.Track;
import com.audira.music.player.AudiraPlayerManager;
import com.bumptech.glide.Glide;

import java.util.ArrayList;
import java.util.List;

public class TrackAdapter extends RecyclerView.Adapter<TrackAdapter.ViewHolder> {

    private final Context context;
    private List<Track> trackList;
    private final OnTrackClickListener listener;

    public interface OnTrackClickListener {
        void onTrackClick(Track track, List<Track> queue);
    }

    public TrackAdapter(Context context, List<Track> trackList, OnTrackClickListener listener) {
        this.context = context;
        this.trackList = trackList != null ? trackList : new ArrayList<>();
        this.listener = listener;
    }

    public void updateTracks(List<Track> newTracks) {
        this.trackList = newTracks != null ? newTracks : new ArrayList<>();
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_track, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Track track = trackList.get(position);
        holder.tvTitle.setText(track.getTitle());
        holder.tvArtist.setText(track.getArtistName());

        int duration = track.getDuration();
        holder.tvDuration.setText(String.format("%d:%02d", duration / 60, duration % 60));

        if (track.getCoverUrl() != null && !track.getCoverUrl().isEmpty()) {
            Glide.with(context)
                 .load(track.getCoverUrl())
                 .centerCrop()
                 .into(holder.imgCover);
        }

        holder.itemView.setOnClickListener(v -> {
            if (listener != null) listener.onTrackClick(track, trackList);
            else AudiraPlayerManager.getInstance(context).playTrack(track, trackList);
        });
    }

    @Override
    public int getItemCount() {
        return trackList.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        ImageView imgCover;
        TextView tvTitle, tvArtist, tvDuration;
        ImageButton btnLike;

        ViewHolder(View itemView) {
            super(itemView);
            imgCover = itemView.findViewById(R.id.imgTrackCover);
            tvTitle = itemView.findViewById(R.id.tvTrackTitle);
            tvArtist = itemView.findViewById(R.id.tvTrackArtist);
            tvDuration = itemView.findViewById(R.id.tvTrackDuration);
            btnLike = itemView.findViewById(R.id.btnTrackLike);
        }
    }
}
