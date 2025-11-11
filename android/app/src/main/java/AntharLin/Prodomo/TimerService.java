package AntharLin.Prodomo;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import androidx.core.app.NotificationCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

public class TimerService extends Service {

    private final Handler handler = new Handler(Looper.getMainLooper());
    private Runnable timerRunnable;
    private int secondsLeft;

    public static final String ACTION_TIMER_UPDATE = "AntharLin.Prodomo.ACTION_TIMER_UPDATE";
    public static final String EXTRA_SECONDS_LEFT = "extra_seconds_left";
    private boolean isTimerRunning = false;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.getAction() != null) {
            String action = intent.getAction();
            switch (action) {
                case "START":
                    secondsLeft = intent.getIntExtra("seconds", 0);
                    startTimer();
                    break;
                case "PAUSE":
                    stopTimer();
                    break;
                case "RESET":
                    stopTimer();
                    secondsLeft = 0; // Or reset to initial value
                    broadcastUpdate(); // Notify UI of reset
                    break;
            }
        }
        
        createNotificationChannel();
        Notification notification = new NotificationCompat.Builder(this, "TimerChannel")
                .setContentTitle("Pomodoro Timer")
                .setContentText(isTimerRunning ? "Timer is running..." : "Timer is paused.")
                .setSmallIcon(R.mipmap.ic_launcher)
                .build();

        startForeground(1, notification);

        return START_STICKY;
    }

    private void startTimer() {
        isTimerRunning = true;
        handler.removeCallbacks(timerRunnable);
        timerRunnable = new Runnable() {
            @Override
            public void run() {
                if (secondsLeft > 0) {
                    secondsLeft--;
                    broadcastUpdate();
                    handler.postDelayed(this, 1000);
                } else {
                    isTimerRunning = false;
                    // Optionally stop self or just wait for next command
                }
            }
        };
        handler.post(timerRunnable);
    }

    private void stopTimer() {
        isTimerRunning = false;
        handler.removeCallbacks(timerRunnable);
    }

    private void broadcastUpdate() {
        Intent intent = new Intent(ACTION_TIMER_UPDATE);
        intent.putExtra(EXTRA_SECONDS_LEFT, secondsLeft);
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopTimer();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    "TimerChannel",
                    "Timer Service Channel",
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
