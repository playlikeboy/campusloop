package space.campusloop.web;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

/**
 * CampusLoop Web: loads https://campusloop.space (capacitor.config.json server.url) in a WebView.
 *
 * Native glue lives in three small classes:
 * - ShellPlugin: OAuth hand-off to a Custom Tab, back button, share and blob downloads.
 * - ShellWebViewClient: offline screen for network failures of the main page.
 * - ShellChromeClient: camera + gallery file picker and full-screen video.
 */
public class MainActivity extends BridgeActivity {

    private ShellChromeClient chromeClient;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ShellPlugin.class);
        super.onCreate(savedInstanceState);

        // Replace Capacitor's clients before the first page load reports back (callbacks run on
        // this thread after onCreate returns).
        bridge.setWebViewClient(new ShellWebViewClient(bridge));
        chromeClient = new ShellChromeClient(bridge);
        bridge.getWebView().setWebChromeClient(chromeClient);
        bridge.getWebView().setDownloadListener(new ShellDownloadListener(this));
    }

    /** True when a full-screen video was showing and has been closed. */
    boolean exitFullScreen() {
        return chromeClient != null && chromeClient.exitFullScreen();
    }
}
