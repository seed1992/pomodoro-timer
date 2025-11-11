package AntharLin.Prodomo;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ForegroundService")
public class ForegroundServicePlugin extends Plugin {

    private static final String TAG = "ForegroundServicePlugin";

    @PluginMethod
    public void start(PluginCall call) {
        // 獲取傳入的參數
        String title = call.getString("title", "Pomodoro Timer");
        String text = call.getString("text", "Running in background...");
        int secondsLeft = call.getInt("secondsLeft", 0);
        
        // 建立 Intent
        Intent serviceIntent = new Intent(getContext(), PomodoroForegroundService.class);
        serviceIntent.putExtra("title", title);
        serviceIntent.putExtra("text", text);
        serviceIntent.putExtra("secondsLeft", secondsLeft);

        // 啟動服務
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(serviceIntent);
            } else {
                getContext().startService(serviceIntent);
            }
            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "Failed to start foreground service", e);
            call.reject("Failed to start foreground service", e);
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), PomodoroForegroundService.class);
        getContext().stopService(serviceIntent);
        call.resolve();
    }

    @PluginMethod
    public void update(PluginCall call) {
        // 獲取傳入的參數
        String title = call.getString("title", "Pomodoro Timer");
        String text = call.getString("text", "Running in background...");
        int secondsLeft = call.getInt("secondsLeft", 0);

        // 建立 Intent
        Intent serviceIntent = new Intent(getContext(), PomodoroForegroundService.class);
        serviceIntent.setAction(PomodoroForegroundService.ACTION_UPDATE);
        serviceIntent.putExtra("title", title);
        serviceIntent.putExtra("text", text);
        serviceIntent.putExtra("secondsLeft", secondsLeft);

        // 發送更新指令
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(serviceIntent);
            } else {
                getContext().startService(serviceIntent);
            }
            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "Failed to update foreground service", e);
            call.reject("Failed to update foreground service", e);
        }
    }
}
