package com.pandastracker.app;

import android.os.Bundle;
import android.util.DisplayMetrics;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private int lastTopPx = 0;
    private int lastBottomPx = 0;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView wv = getBridge().getWebView();
        wv.addJavascriptInterface(new InsetsBridge(), "AndroidInsets");

        ViewCompat.setOnApplyWindowInsetsListener(wv.getRootView(), (v, windowInsets) -> {
            Insets bars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
            DisplayMetrics metrics = getResources().getDisplayMetrics();
            float density = metrics.density;
            lastTopPx = Math.round(bars.top / density);
            lastBottomPx = Math.round(bars.bottom / density);
            injectInsets();
            return windowInsets;
        });

        wv.postDelayed(() -> ViewCompat.requestApplyInsets(wv.getRootView()), 200);
        wv.postDelayed(() -> ViewCompat.requestApplyInsets(wv.getRootView()), 1000);
        wv.postDelayed(() -> ViewCompat.requestApplyInsets(wv.getRootView()), 3000);
    }

    private void injectInsets() {
        WebView wv = getBridge().getWebView();
        String js = "(function(){var r=document.documentElement;if(r){r.style.setProperty('--sat','" + lastTopPx + "px');r.style.setProperty('--sab','" + lastBottomPx + "px');}})();";
        wv.post(() -> wv.evaluateJavascript(js, null));
    }

    public class InsetsBridge {
        @JavascriptInterface
        public int getTop() { return lastTopPx; }

        @JavascriptInterface
        public int getBottom() { return lastBottomPx; }
    }
}
