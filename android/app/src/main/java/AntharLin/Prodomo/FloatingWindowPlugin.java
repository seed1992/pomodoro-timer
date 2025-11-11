package AntharLin.Prodomo;

import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;
import androidx.annotation.RequiresApi;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "FloatingWindow")
public class FloatingWindowPlugin extends Plugin {

    private static final int OVERLAY_PERMISSION_REQUEST_CODE = 1001;
    private static final String FLOATING_WINDOW_TAG = "PomodoroFloatingWindow";

    private WindowManager windowManager;
    private View floatingView;
    private TextView timerTextView;

    @PluginMethod
    public void checkPermission(PluginCall call) {
        JSObject ret = new JSObject();
        boolean hasPermission = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && Settings.canDrawOverlays(getContext());
        ret.put("hasPermission", hasPermission);
        call.resolve(ret);
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (!Settings.canDrawOverlays(getContext())) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getContext().getPackageName()));
            startActivityForResult(call, intent, OVERLAY_PERMISSION_REQUEST_CODE);
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        }
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        if (requestCode == OVERLAY_PERMISSION_REQUEST_CODE) {
            PluginCall call = getSavedCall();
            if (call != null) {
                JSObject ret = new JSObject();
                boolean granted = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && Settings.canDrawOverlays(getContext());
                ret.put("granted", granted);
                call.resolve(ret);
            }
        }
    }

    @PluginMethod
    public void show(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(getContext())) {
            call.reject("Overlay permission not granted");
            return;
        }

        if (floatingView != null) {
            call.resolve();
            return;
        }

        windowManager = (WindowManager) getContext().getSystemService(Context.WINDOW_SERVICE);

        timerTextView = new TextView(getContext());
        timerTextView.setTextSize(24);
        timerTextView.setTextColor(0xFFFFFFFF); // White
        timerTextView.setBackgroundColor(0xAA000000); // Semi-transparent black
        timerTextView.setPadding(20, 10, 20, 10);
        timerTextView.setText(call.getString("initialText", "00:00"));

        floatingView = timerTextView;

        int layoutFlag;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            layoutFlag = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            layoutFlag = WindowManager.LayoutParams.TYPE_PHONE;
        }

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                layoutFlag,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT);

        params.gravity = Gravity.TOP | Gravity.START;
        params.x = 100;
        params.y = 100;

        new Handler(Looper.getMainLooper()).post(() -> {
            try {
                windowManager.addView(floatingView, params);
                call.resolve();
            } catch (Exception e) {
                Log.e(FLOATING_WINDOW_TAG, "Error adding floating view", e);
                call.reject("Error adding floating view", e);
            }
        });
    }

    @PluginMethod
    public void hide(PluginCall call) {
        if (floatingView != null) {
            new Handler(Looper.getMainLooper()).post(() -> {
                try {
                    windowManager.removeView(floatingView);
                    floatingView = null;
                    timerTextView = null;
                    call.resolve();
                } catch (Exception e) {
                    Log.e(FLOATING_WINDOW_TAG, "Error removing floating view", e);
                    call.reject("Error removing floating view", e);
                }
            });
        } else {
            call.resolve();
        }
    }

    @PluginMethod
    public void update(PluginCall call) {
        final String newText = call.getString("text", "00:00");
        if (timerTextView != null) {
            new Handler(Looper.getMainLooper()).post(() -> timerTextView.setText(newText));
            call.resolve();
        } else {
            call.reject("Floating window not visible");
        }
    }
}
