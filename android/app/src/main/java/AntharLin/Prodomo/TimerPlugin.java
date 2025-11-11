package AntharLin.Prodomo;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Timer")
public class TimerPlugin extends Plugin {

    private BroadcastReceiver timerUpdateReceiver;

    @Override
    public void load() {
        super.load();
        // The service is now started on demand, but we can still start it here if needed
        // to ensure it's ready.
        Intent serviceIntent = new Intent(getContext(), TimerService.class);
        getContext().startService(serviceIntent);

        timerUpdateReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (TimerService.ACTION_TIMER_UPDATE.equals(intent.getAction())) {
                    int secondsLeft = intent.getIntExtra(TimerService.EXTRA_SECONDS_LEFT, 0);
                    JSObject ret = new JSObject();
                    ret.put("secondsLeft", secondsLeft);
                    notifyListeners("timerTick", ret);
                }
            }
        };
        LocalBroadcastManager.getInstance(getContext()).registerReceiver(timerUpdateReceiver, new IntentFilter(TimerService.ACTION_TIMER_UPDATE));
    }

    private void sendCommand(String action) {
        Intent intent = new Intent(getContext(), TimerService.class);
        intent.setAction(action);
        getContext().startService(intent);
    }

    @PluginMethod
    public void start(PluginCall call) {
        Integer seconds = call.getInt("seconds");
        if (seconds != null) {
            Intent intent = new Intent(getContext(), TimerService.class);
            intent.setAction("START");
            intent.putExtra("seconds", seconds.intValue());
            getContext().startService(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void pause(PluginCall call) {
        sendCommand("PAUSE");
        call.resolve();
    }

    @PluginMethod
    public void reset(PluginCall call) {
        sendCommand("RESET");
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        if (timerUpdateReceiver != null) {
            LocalBroadcastManager.getInstance(getContext()).unregisterReceiver(timerUpdateReceiver);
        }
    }
}
