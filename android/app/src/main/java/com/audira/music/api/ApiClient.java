package com.audira.music.api;

import android.content.Context;
import com.audira.music.utils.TokenManager;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

import java.util.concurrent.TimeUnit;

public class ApiClient {
    // 10.0.2.2 is Android emulator's loopback alias for localhost
    public static final String BASE_URL = "http://10.0.2.2:5000/api/v1/";

    private static ApiService instance;

    public static synchronized ApiService getService(Context context) {
        if (instance == null) {
            TokenManager tokenManager = new TokenManager(context.getApplicationContext());

            HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
            logging.setLevel(HttpLoggingInterceptor.Level.BODY);

            OkHttpClient client = new OkHttpClient.Builder()
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(15, TimeUnit.SECONDS)
                .addInterceptor(chain -> {
                    Request original = chain.request();
                    Request.Builder builder = original.newBuilder();

                    String token = tokenManager.getToken();
                    if (token != null) {
                        builder.header("Authorization", "Bearer " + token);
                    }

                    return chain.proceed(builder.build());
                })
                .addInterceptor(logging)
                .build();

            Retrofit retrofit = new Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build();

            instance = retrofit.create(ApiService.class);
        }
        return instance;
    }
}
