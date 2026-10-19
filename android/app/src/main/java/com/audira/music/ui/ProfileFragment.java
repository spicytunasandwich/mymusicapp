package com.audira.music.ui;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.audira.music.R;
import com.audira.music.models.User;
import com.audira.music.utils.TokenManager;
import com.bumptech.glide.Glide;

public class ProfileFragment extends Fragment {

    private ImageView imgProfileAvatar, imgProfileBanner;
    private TextView tvProfileDisplayName, tvProfileUsername, tvProfileBio;
    private View bannerLayout;
    private Button btnLogout;
    private TokenManager tokenManager;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_profile, container, false);

        imgProfileAvatar = view.findViewById(R.id.imgProfileAvatar);
        imgProfileBanner = view.findViewById(R.id.imgProfileBanner);
        tvProfileDisplayName = view.findViewById(R.id.tvProfileDisplayName);
        tvProfileUsername = view.findViewById(R.id.tvProfileUsername);
        tvProfileBio = view.findViewById(R.id.tvProfileBio);
        bannerLayout = view.findViewById(R.id.bannerLayout);
        btnLogout = view.findViewById(R.id.btnLogout);

        tokenManager = new TokenManager(requireContext());
        User user = tokenManager.getUser();

        if (user != null) {
            tvProfileDisplayName.setText(user.getDisplayName());
            tvProfileUsername.setText("@" + user.getUsername());
            tvProfileBio.setText(user.getBio() != null && !user.getBio().isEmpty() ? user.getBio() : "No bio provided.");

            if (user.getAccentColor() != null) {
                try {
                    bannerLayout.setBackgroundColor(Color.parseColor(user.getAccentColor()));
                } catch (Exception ignored) {}
            }

            if (user.getAvatarUrl() != null && !user.getAvatarUrl().isEmpty()) {
                Glide.with(this).load(user.getAvatarUrl()).centerCrop().into(imgProfileAvatar);
            }
            if (user.getBannerUrl() != null && !user.getBannerUrl().isEmpty()) {
                Glide.with(this).load(user.getBannerUrl()).centerCrop().into(imgProfileBanner);
            }
        }

        btnLogout.setOnClickListener(v -> {
            tokenManager.clear();
            startActivity(new Intent(getContext(), LoginActivity.class));
            requireActivity().finish();
        });

        return view;
    }
}
