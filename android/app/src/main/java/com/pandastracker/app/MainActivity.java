package com.pandastracker.app;

import android.os.Bundle;
import android.util.DisplayMetrics;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        ViewCompat.setOnApplyWindowInsetsListener(getBridge().getWebView(), (v, windowInsets) -> {
            Insets bars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
            DisplayMetrics metrics = getResources().getDisplayMetrics();
            float density = metrics.density;
            int topDp = Math.round(bars.top / density);
            int bottomDp = Math.round(bars.bottom / density);
            String js = "(function(){var r=document.documentElement;r.style.setProperty('--sat','" + topDp + "px');r.style.setProperty('--sab','" + bottomDp + "px');})();";
            getBridge().getWebView().post(() -> getBridge().getWebView().evaluateJavascript(js, null));
            return windowInsets;
        });
    }
}
