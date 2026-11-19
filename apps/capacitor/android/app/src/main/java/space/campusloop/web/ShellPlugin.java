package space.campusloop.web;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import androidx.browser.customtabs.CustomTabsIntent;
import androidx.core.content.FileProvider;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;

/**
 * Native glue for the CampusLoop Web shell.
 *
 * Google sign-in: Google refuses OAuth inside an embedded WebView (403 disallowed_useragent), and
 * we do not hide the WebView marker from Google. So when the website navigates to an OAuth
 * provider, this plugin opens https://campusloop.space/app-auth/start in a Chrome Custom Tab. That
 * route marks the browser with a short-lived cookie and forwards to the provider. When the flow
 * lands on /handler/oauth-callback in the Custom Tab, the website sees the cookie and redirects to
 * space.campusloop.web://auth/oauth-callback?code=...&state=... which reopens this app. We then
 * load https://campusloop.space/handler/oauth-callback?code=...&state=... in the WebView, where the
 * PKCE verifier cookie from the start of the flow lives, and Hexclave finishes the sign-in.
 */
@CapacitorPlugin(name = "CampusLoopShell")
public class ShellPlugin extends Plugin {

    static final String SITE = "https://campusloop.space";
    static final String RETURN_SCHEME = "space.campusloop.web";
    private static final String RETURN_HOST = "auth";

    /** True between opening a sign-in Custom Tab and coming back to the app. */
    private boolean oauthPending = false;

    @Override
    public void load() {
        injectShellScript();
        registerBackButton();

        // Cold start from the sign-in return link: load the callback after the start URL load.
        Intent launch = getActivity().getIntent();
        final Uri data = launch != null ? launch.getData() : null;
        if (isAuthReturn(data)) {
            launch.setData(null);
            getBridge().getWebView().post(() -> loadAuthReturn(data));
        }
    }

    // ---------------------------------------------------------------- navigation

    @Override
    public Boolean shouldOverrideLoad(Uri url) {
        String scheme = url.getScheme();
        if ("intent".equalsIgnoreCase(scheme)) {
            openIntentUri(url);
            return true;
        }
        if (isOAuthProviderUrl(url)) {
            openSignInTab(url);
            return true;
        }
        // Everything else: Capacitor keeps campusloop.space and server.allowNavigation hosts in the
        // WebView and opens any other link in the system browser or the app that handles it.
        return null;
    }

    /** OAuth authorize pages that refuse (Google) or should not run (others) inside a WebView. */
    static boolean isOAuthProviderUrl(Uri url) {
        if (!"https".equalsIgnoreCase(url.getScheme()) || url.getHost() == null) return false;
        String host = url.getHost().toLowerCase();
        String path = url.getPath() == null ? "" : url.getPath();
        if (host.equals("accounts.google.com")) return true;
        if (host.equals("github.com") && path.startsWith("/login/oauth")) return true;
        if ((host.equals("api.hexclave.com") || host.equals("api.stack-auth.com")) && path.contains("/auth/oauth/authorize/")) {
            return true;
        }
        return false;
    }

    private void openSignInTab(Uri providerUrl) {
        Uri start = Uri.parse(SITE + "/app-auth/start").buildUpon().appendQueryParameter("to", providerUrl.toString()).build();
        oauthPending = true;
        try {
            new CustomTabsIntent.Builder().setShowTitle(true).build().launchUrl(getActivity(), start);
        } catch (ActivityNotFoundException e) {
            try {
                getActivity().startActivity(new Intent(Intent.ACTION_VIEW, start));
            } catch (ActivityNotFoundException ignored) {
                oauthPending = false;
                toast("Install a web browser to sign in with Google.");
            }
        }
    }

    private void openIntentUri(Uri url) {
        try {
            Intent intent = Intent.parseUri(url.toString(), Intent.URI_INTENT_SCHEME);
            intent.addCategory(Intent.CATEGORY_BROWSABLE);
            intent.setComponent(null);
            intent.setSelector(null);
            try {
                getActivity().startActivity(intent);
            } catch (ActivityNotFoundException e) {
                String fallback = intent.getStringExtra("browser_fallback_url");
                if (fallback != null && fallback.startsWith("https://")) {
                    getActivity().startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(fallback)));
                }
            }
        } catch (Exception ignored) {}
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        Uri data = intent.getData();
        if (isAuthReturn(data)) {
            loadAuthReturn(data);
        }
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        // The user closed the sign-in tab without finishing: reload so the sign-in page is usable
        // again (Hexclave leaves its button spinning while it waits for the redirect).
        if (oauthPending) {
            oauthPending = false;
            getBridge().getWebView().reload();
        }
    }

    static boolean isAuthReturn(Uri data) {
        if (data == null) return false;
        if (!RETURN_SCHEME.equalsIgnoreCase(data.getScheme()) || !RETURN_HOST.equalsIgnoreCase(data.getHost())) return false;
        String segment = authSegment(data);
        return segment.equals("oauth-callback") || segment.equals("error");
    }

    private static String authSegment(Uri data) {
        String path = data.getPath() == null ? "" : data.getPath();
        while (path.startsWith("/")) path = path.substring(1);
        return path;
    }

    private void loadAuthReturn(Uri data) {
        oauthPending = false;
        String query = data.getEncodedQuery();
        String target = SITE + "/handler/" + authSegment(data) + (query != null ? "?" + query : "");
        getBridge().getWebView().loadUrl(target);
    }

    // ---------------------------------------------------------------- back button

    private void registerBackButton() {
        final Activity activity = getActivity();
        OnBackPressedCallback callback = new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (activity instanceof MainActivity && ((MainActivity) activity).exitFullScreen()) {
                    return;
                }
                WebView webView = getBridge().getWebView();
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    activity.finish();
                }
            }
        };
        getBridge().getActivity().getOnBackPressedDispatcher().addCallback(getBridge().getActivity(), callback);
    }

    // ---------------------------------------------------------------- injected script

    private void injectShellScript() {
        String script = readAsset("campusloop-shell.js");
        if (script == null) return;
        // Same requirement as Capacitor's own bridge on remote pages (WebView 83+).
        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            try {
                WebViewCompat.addDocumentStartJavaScript(getBridge().getWebView(), script, Collections.singleton(SITE));
            } catch (Exception ignored) {}
        }
    }

    private String readAsset(String name) {
        try (InputStream in = getContext().getAssets().open(name)) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int read;
            while ((read = in.read(buffer)) != -1) out.write(buffer, 0, read);
            return out.toString(StandardCharsets.UTF_8.name());
        } catch (Exception e) {
            return null;
        }
    }

    // ---------------------------------------------------------------- share

    /** navigator.share() for the WebView: text, url and files (base64) through the Android share sheet. */
    @PluginMethod
    public void share(PluginCall call) {
        String title = call.getString("title", "");
        String text = call.getString("text", "");
        String url = call.getString("url", "");
        String body = text;
        if (!url.isEmpty() && !text.contains(url)) body = text.isEmpty() ? url : text + "\n" + url;

        ArrayList<Uri> uris = new ArrayList<>();
        String mime = null;
        try {
            JSArray files = call.getArray("files", new JSArray());
            File dir = new File(getContext().getCacheDir(), "share");
            //noinspection ResultOfMethodCallIgnored
            dir.mkdirs();
            for (int i = 0; i < files.length(); i++) {
                JSObject file = JSObject.fromJSONObject(files.getJSONObject(i));
                String type = file.getString("type", "application/octet-stream");
                File out = writeBase64(dir, file.getString("name", "file"), file.getString("data", ""));
                uris.add(FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", out));
                mime = mime == null ? type : (mime.equals(type) ? mime : "*/*");
            }
        } catch (Exception e) {
            call.reject("Could not prepare the files to share", e);
            return;
        }

        Intent send;
        if (uris.isEmpty()) {
            send = new Intent(Intent.ACTION_SEND);
            send.setType("text/plain");
        } else if (uris.size() == 1) {
            send = new Intent(Intent.ACTION_SEND);
            send.setType(mime);
            send.putExtra(Intent.EXTRA_STREAM, uris.get(0));
            send.setClipData(ClipData.newRawUri("", uris.get(0)));
        } else {
            send = new Intent(Intent.ACTION_SEND_MULTIPLE);
            send.setType(mime);
            send.putParcelableArrayListExtra(Intent.EXTRA_STREAM, uris);
            ClipData clip = ClipData.newRawUri("", uris.get(0));
            for (int i = 1; i < uris.size(); i++) clip.addItem(new ClipData.Item(uris.get(i)));
            send.setClipData(clip);
        }
        if (!body.isEmpty()) send.putExtra(Intent.EXTRA_TEXT, body);
        if (!title.isEmpty()) send.putExtra(Intent.EXTRA_SUBJECT, title);
        send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

        try {
            getActivity().startActivity(Intent.createChooser(send, title.isEmpty() ? null : title));
            call.resolve();
        } catch (Exception e) {
            call.reject("No app can share this", e);
        }
    }

    // ---------------------------------------------------------------- downloads

    /** Saves a blob:/data: download. Images go to Pictures/CampusLoop, other files to Downloads. */
    @PluginMethod
    public void saveFile(PluginCall call) {
        String name = safeName(call.getString("name", "campusloop-download"));
        String type = call.getString("type", "application/octet-stream");
        String data = call.getString("data", "");
        try {
            byte[] bytes = Base64.decode(data, Base64.DEFAULT);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                boolean image = type.startsWith("image/");
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
                values.put(MediaStore.MediaColumns.MIME_TYPE, type);
                values.put(
                    MediaStore.MediaColumns.RELATIVE_PATH,
                    (image ? Environment.DIRECTORY_PICTURES : Environment.DIRECTORY_DOWNLOADS) + "/CampusLoop"
                );
                values.put(MediaStore.MediaColumns.IS_PENDING, 1);
                ContentResolver resolver = getContext().getContentResolver();
                Uri collection = image
                    ? MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                    : MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
                Uri item = resolver.insert(collection, values);
                if (item == null) throw new IllegalStateException("MediaStore insert failed");
                try (OutputStream out = resolver.openOutputStream(item)) {
                    if (out == null) throw new IllegalStateException("No output stream");
                    out.write(bytes);
                }
                values.clear();
                values.put(MediaStore.MediaColumns.IS_PENDING, 0);
                resolver.update(item, values, null, null);
                toast(image ? "Saved to your gallery" : "Saved to Downloads");
                call.resolve();
            } else {
                // Android 9 and older need a storage permission to write to shared folders, so
                // hand the file to the share sheet instead (Save to Files, Drive, Instagram...).
                File dir = new File(getContext().getCacheDir(), "share");
                //noinspection ResultOfMethodCallIgnored
                dir.mkdirs();
                File out = writeBytes(dir, name, bytes);
                Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", out);
                Intent send = new Intent(Intent.ACTION_SEND);
                send.setType(type);
                send.putExtra(Intent.EXTRA_STREAM, uri);
                send.setClipData(ClipData.newRawUri("", uri));
                send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                getActivity().startActivity(Intent.createChooser(send, "Save " + name));
                call.resolve();
            }
        } catch (Exception e) {
            toast("Could not save the file");
            call.reject("Could not save the file", e);
        }
    }

    private static String safeName(String name) {
        String clean = name == null ? "" : name.replaceAll("[^A-Za-z0-9._-]", "_");
        if (clean.isEmpty() || clean.startsWith(".")) clean = "file" + clean;
        return clean.length() > 100 ? clean.substring(clean.length() - 100) : clean;
    }

    private static File writeBase64(File dir, String name, String base64) throws Exception {
        return writeBytes(dir, name, Base64.decode(base64, Base64.DEFAULT));
    }

    private static File writeBytes(File dir, String name, byte[] bytes) throws Exception {
        File out = new File(dir, safeName(name));
        try (FileOutputStream stream = new FileOutputStream(out)) {
            stream.write(bytes);
        }
        return out;
    }

    private void toast(final String message) {
        getActivity().runOnUiThread(() -> Toast.makeText(getContext(), message, Toast.LENGTH_SHORT).show());
    }
}
