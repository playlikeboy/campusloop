package space.campusloop.web;

import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * Shows the bundled offline screen (www/index.html) when the main page cannot be reached.
 *
 * Capacitor's own server.errorPath also fires on HTTP errors, which would turn every 404 on
 * campusloop.space into "You're offline". This client only reacts to network failures.
 */
public class ShellWebViewClient extends BridgeWebViewClient {

    private static final String OFFLINE_ASSET = "public/index.html";

    public ShellWebViewClient(Bridge bridge) {
        super(bridge);
    }

    @Override
    public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
        super.onReceivedError(view, request, error);
        if (!request.isForMainFrame() || !isNetworkError(error.getErrorCode())) {
            return;
        }
        String html = readOfflinePage(view);
        if (html != null) {
            // about:blank origin, so the page has no bridge access. Its Retry button navigates
            // back to https://campusloop.space.
            view.loadDataWithBaseURL(null, html, "text/html", "utf-8", null);
        }
    }

    private static boolean isNetworkError(int code) {
        return (
            code == WebViewClient.ERROR_HOST_LOOKUP ||
            code == WebViewClient.ERROR_CONNECT ||
            code == WebViewClient.ERROR_TIMEOUT ||
            code == WebViewClient.ERROR_IO ||
            code == WebViewClient.ERROR_FAILED_SSL_HANDSHAKE ||
            code == WebViewClient.ERROR_UNKNOWN
        );
    }

    private static String readOfflinePage(WebView view) {
        try (InputStream in = view.getContext().getAssets().open(OFFLINE_ASSET)) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int read;
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
            }
            return out.toString(StandardCharsets.UTF_8.name());
        } catch (Exception e) {
            return null;
        }
    }
}
