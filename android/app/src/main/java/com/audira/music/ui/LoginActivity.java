package com.audira.music.ui;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import com.audira.music.R;
import com.audira.music.api.ApiClient;
import com.audira.music.api.ApiService;
import com.audira.music.models.AuthResponse;
import com.audira.music.models.LoginRequest;
import com.audira.music.models.SignupRequest;
import com.audira.music.utils.TokenManager;
import com.google.android.material.tabs.TabLayout;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {

    private TabLayout tabLayout;
    private EditText etIdentifier, etPassword, etUsername, etDisplayName;
    private Button btnSubmit;
    private TextView btnDemoAutofill, tvError;
    private ProgressBar progressBar;

    private TokenManager tokenManager;
    private ApiService apiService;
    private boolean isLoginTab = true;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        tokenManager = new TokenManager(this);
        // If already authenticated, advance directly
        if (tokenManager.isLoggedIn()) {
            startActivity(new Intent(this, MainActivity.class));
            finish();
            return;
        }

        setContentView(R.layout.activity_login);
        apiService = ApiClient.getService(this);

        initViews();
        setupTabs();
    }

    private void initViews() {
        tabLayout = findViewById(R.id.tabLayout);
        etIdentifier = findViewById(R.id.etIdentifier);
        etPassword = findViewById(R.id.etPassword);
        etUsername = findViewById(R.id.etUsername);
        etDisplayName = findViewById(R.id.etDisplayName);
        btnSubmit = findViewById(R.id.btnSubmit);
        btnDemoAutofill = findViewById(R.id.btnDemoAutofill);
        tvError = findViewById(R.id.tvError);
        progressBar = findViewById(R.id.progressBar);

        btnDemoAutofill.setOnClickListener(v -> {
            tabLayout.getTabAt(0).select();
            etIdentifier.setText("demo@audira.io");
            etPassword.setText("password123");
            tvError.setVisibility(View.GONE);
        });

        btnSubmit.setOnClickListener(v -> handleAuth());
    }

    private void setupTabs() {
        tabLayout.addTab(tabLayout.newTab().setText("Log In"));
        tabLayout.addTab(tabLayout.newTab().setText("Sign Up"));

        tabLayout.addOnTabSelectedListener(new TabLayout.OnTabSelectedListener() {
            @Override
            public void onTabSelected(TabLayout.Tab tab) {
                isLoginTab = tab.getPosition() == 0;
                tvError.setVisibility(View.GONE);

                if (isLoginTab) {
                    etDisplayName.setVisibility(View.GONE);
                    etUsername.setVisibility(View.GONE);
                    etIdentifier.setHint("Email or Username");
                    btnSubmit.setText("Log In");
                } else {
                    etDisplayName.setVisibility(View.VISIBLE);
                    etUsername.setVisibility(View.VISIBLE);
                    etIdentifier.setHint("Email Address");
                    btnSubmit.setText("Create Free Account");
                }
            }
            @Override public void onTabUnselected(TabLayout.Tab tab) {}
            @Override public void onTabReselected(TabLayout.Tab tab) {}
        });
    }

    private void handleAuth() {
        tvError.setVisibility(View.GONE);
        String password = etPassword.getText().toString().trim();
        if (password.length() < 6) {
            showError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);

        if (isLoginTab) {
            String identifier = etIdentifier.getText().toString().trim();
            if (identifier.isEmpty()) {
                setLoading(false);
                showError("Please enter your email or username.");
                return;
            }

            apiService.login(new LoginRequest(identifier, password)).enqueue(new Callback<AuthResponse>() {
                @Override
                public void onResponse(Call<AuthResponse> call, Response<AuthResponse> response) {
                    setLoading(false);
                    if (response.isSuccessful() && response.body() != null) {
                        tokenManager.saveSession(response.body().getToken(), response.body().getUser());
                        startActivity(new Intent(LoginActivity.this, MainActivity.class));
                        finish();
                    } else {
                        showError("Invalid credentials. Try demo credentials.");
                    }
                }

                @Override
                public void onFailure(Call<AuthResponse> call, Throwable t) {
                    setLoading(false);
                    showError("Network error: " + t.getMessage());
                }
            });
        } else {
            String email = etIdentifier.getText().toString().trim();
            String username = etUsername.getText().toString().trim();
            String displayName = etDisplayName.getText().toString().trim();

            if (email.isEmpty() || username.isEmpty()) {
                setLoading(false);
                showError("Please fill in all registration fields.");
                return;
            }

            apiService.signup(new SignupRequest(email, password, username, displayName)).enqueue(new Callback<AuthResponse>() {
                @Override
                public void onResponse(Call<AuthResponse> call, Response<AuthResponse> response) {
                    setLoading(false);
                    if (response.isSuccessful() && response.body() != null) {
                        tokenManager.saveSession(response.body().getToken(), response.body().getUser());
                        startActivity(new Intent(LoginActivity.this, MainActivity.class));
                        finish();
                    } else {
                        showError("Registration failed. Email or username may be in use.");
                    }
                }

                @Override
                public void onFailure(Call<AuthResponse> call, Throwable t) {
                    setLoading(false);
                    showError("Connection failed: " + t.getMessage());
                }
            });
        }
    }

    private void setLoading(boolean loading) {
        progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
        btnSubmit.setEnabled(!loading);
    }

    private void showError(String msg) {
        tvError.setText(msg);
        tvError.setVisibility(View.VISIBLE);
    }
}
