package com.audira.music.ui.adapters;

import android.content.Context;
import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.audira.music.R;

import java.util.ArrayList;
import java.util.List;

public class LyricsAdapter extends RecyclerView.Adapter<LyricsAdapter.ViewHolder> {

    public static class LyricLine {
        public long timeMs;
        public String text;

        public LyricLine(long timeMs, String text) {
            this.timeMs = timeMs;
            this.text = text;
        }
    }

    private final Context context;
    private List<LyricLine> lines = new ArrayList<>();
    private int activeIndex = -1;

    public LyricsAdapter(Context context) {
        this.context = context;
    }

    public void setLines(List<LyricLine> newLines) {
        this.lines = newLines != null ? newLines : new ArrayList<>();
        this.activeIndex = -1;
        notifyDataSetChanged();
    }

    public void setActiveIndex(int index) {
        if (this.activeIndex != index) {
            int prev = this.activeIndex;
            this.activeIndex = index;
            if (prev != -1) notifyItemChanged(prev);
            if (index != -1) notifyItemChanged(index);
        }
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_lyric_line, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        LyricLine line = lines.get(position);
        holder.tvLine.setText(line.text);

        if (position == activeIndex) {
            holder.tvLine.setTextColor(Color.WHITE);
            holder.tvLine.setTextSize(22);
            holder.tvLine.setAlpha(1.0f);
        } else if (position < activeIndex) {
            holder.tvLine.setTextColor(Color.parseColor("#94A3B8"));
            holder.tvLine.setTextSize(18);
            holder.tvLine.setAlpha(0.6f);
        } else {
            holder.tvLine.setTextColor(Color.parseColor("#475569"));
            holder.tvLine.setTextSize(18);
            holder.tvLine.setAlpha(0.4f);
        }
    }

    @Override
    public int getItemCount() {
        return lines.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvLine;
        ViewHolder(View itemView) {
            super(itemView);
            tvLine = itemView.findViewById(R.id.tvLyricLine);
        }
    }
}
