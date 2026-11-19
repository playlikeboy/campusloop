package space.campusloop.web;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.provider.MediaStore;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.ValueCallback;
import android.webkit.WebView;
import android.widget.FrameLayout;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebChromeClient;
import java.io.File;
import java.util.ArrayList;
import java.util.List;

/**
 * Two fixes on top of Capacitor's chrome client:
 *
 * 1. A plain <input type="file" accept="image/*"> (no capture attribute) only opened the gallery.
 *    Here it opens a chooser that offers the camera as well as the gallery and file apps.
 * 2. Capacitor closes full-screen video right away. Here YouTube lectures and other videos can go
 *    full screen.
 */
public class ShellChromeClient extends BridgeWebChromeClient {

    private final Bridge bridge;
    private final ActivityResultLauncher<Intent> chooserLauncher;
    private final ActivityResultLauncher<String> cameraPermissionLauncher;

    private ValueCallback<Uri[]> pendingCallback;
    private FileChooserParams pendingParams;
    private File cameraFile;
    private Uri cameraUri;

    private View customView;
    private CustomViewCallback customViewCallback;

    public ShellChromeClient(Bridge bridge) {
        super(bridge);
        this.bridge = bridge;
        chooserLauncher = bridge.registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            (result) -> deliver(result.getResultCode(), result.getData())
        );
        cameraPermissionLauncher = bridge.registerForActivityResult(
            new ActivityResultContracts.RequestPermission(),
            (granted) -> {
                if (pendingCallback != null && pendingParams != null) {
                    launchChooser(granted);
                }
            }
        );
    }

    // ---------------------------------------------------------------- file picker

    @Override
    public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams params) {
        // capture="..." asks for the camera only; Capacitor already handles that well.
        if (params.isCaptureEnabled() || !acceptsImages(params)) {
            return super.onShowFileChooser(webView, filePathCallback, params);
        }
        if (pendingCallback != null) {
            pendingCallback.onReceiveValue(null);
        }
        pendingCallback = filePathCallback;
        pendingParams = params;

        Activity activity = bridge.getActivity();
        boolean cameraGranted =
            ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
        if (cameraGranted) {
            launchChooser(true);
        } else {
            // CAMERA is declared in the manifest, so the camera app cannot be launched without it.
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA);
        }
        return true;
    }

    private static boolean acceptsImages(FileChooserParams params) {
        String[] types = params.getAcceptTypes();
        if (types == null || types.length == 0) return true;
        for (String raw : types) {
            String type = raw == null ? "" : raw.trim().toLowerCase();
            if (type.isEmpty() || type.equals("*/*") || type.startsWith("image/")) return true;
            if (type.equals(".jpg") || type.equals(".jpeg") || type.equals(".png") || type.equals(".webp") || type.equals(".heic")) {
                return true;
            }
        }
        return false;
    }

    private void launchChooser(boolean withCamera) {
        Activity activity = bridge.getActivity();
        FileChooserParams params = pendingParams;

        Intent content = params.createIntent();
        content.addCategory(Intent.CATEGORY_OPENABLE);
        if (params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) {
            content.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        }
        String[] mimeTypes = mimeTypes(params.getAcceptTypes());
        if (mimeTypes.length > 1) {
            content.setType("*/*");
            content.putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes);
        } else if (mimeTypes.length == 1) {
            content.setType(mimeTypes[0]);
        }

        List<Intent> extra = new ArrayList<>();
        cameraFile = null;
        cameraUri = null;
        if (withCamera) {
            Intent camera = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            try {
                File dir = new File(activity.getCacheDir(), "camera");
                //noinspection ResultOfMethodCallIgnored
                dir.mkdirs();
                cameraFile = File.createTempFile("photo_", ".jpg", dir);
                cameraUri = FileProvider.getUriForFile(activity, activity.getPackageName() + ".fileprovider", cameraFile);
                camera.putExtra(MediaStore.EXTRA_OUTPUT, cameraUri);
                camera.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                extra.add(camera);
            } catch (Exception e) {
                cameraFile = null;
                cameraUri = null;
            }
        }

        Intent chooser = Intent.createChooser(content, "Add a photo");
        if (!extra.isEmpty()) {
            chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, extra.toArray(new Intent[0]));
        }
        try {
            chooserLauncher.launch(chooser);
        } catch (Exception e) {
            deliver(Activity.RESULT_CANCELED, null);
        }
    }

    private static String[] mimeTypes(String[] accept) {
        List<String> out = new ArrayList<>();
        if (accept != null) {
            for (String raw : accept) {
                if (raw == null) continue;
                for (String part : raw.split(",")) {
                    String type = part.trim().toLowerCase();
                    if (type.isEmpty()) continue;
                    if (type.startsWith(".")) {
                        String mime = android.webkit.MimeTypeMap.getSingleton().getMimeTypeFromExtension(type.substring(1));
                        if (mime != null) type = mime;
                        else continue;
                    }
                    if (!out.contains(type)) out.add(type);
                }
            }
        }
        return out.toArray(new String[0]);
    }

    private void deliver(int resultCode, Intent data) {
        ValueCallback<Uri[]> callback = pendingCallback;
        pendingCallback = null;
        pendingParams = null;
        if (callback == null) return;

        Uri[] result = null;
        if (resultCode == Activity.RESULT_OK) {
            if (data != null && data.getClipData() != null) {
                int count = data.getClipData().getItemCount();
                result = new Uri[count];
                for (int i = 0; i < count; i++) {
                    result[i] = data.getClipData().getItemAt(i).getUri();
                }
            } else if (data != null && data.getData() != null) {
                result = new Uri[] { data.getData() };
            } else if (cameraFile != null && cameraFile.length() > 0) {
                result = new Uri[] { cameraUri };
            }
        }
        callback.onReceiveValue(result);
    }

    // ---------------------------------------------------------------- full-screen video

    @Override
    public void onShowCustomView(View view, CustomViewCallback callback) {
        if (customView != null) {
            callback.onCustomViewHidden();
            return;
        }
        Activity activity = bridge.getActivity();
        customView = view;
        customViewCallback = callback;
        ViewGroup decor = (ViewGroup) activity.getWindow().getDecorView();
        decor.addView(
            view,
            new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        );
        view.setBackgroundColor(0xFF000000);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(activity.getWindow(), decor);
        controller.hide(WindowInsetsCompat.Type.systemBars());
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }

    @Override
    public void onHideCustomView() {
        if (customView == null) return;
        Activity activity = bridge.getActivity();
        ViewGroup decor = (ViewGroup) activity.getWindow().getDecorView();
        decor.removeView(customView);
        customView = null;
        WindowCompat.getInsetsController(activity.getWindow(), decor).show(WindowInsetsCompat.Type.systemBars());
        if (customViewCallback != null) {
            customViewCallback.onCustomViewHidden();
            customViewCallback = null;
        }
    }

    /** Back button while a video is full screen: leave full screen first. */
    public boolean exitFullScreen() {
        if (customView == null) return false;
        onHideCustomView();
        return true;
    }
}
