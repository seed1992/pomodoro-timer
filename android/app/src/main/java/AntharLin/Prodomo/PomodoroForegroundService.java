package AntharLin.Prodomo;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import androidx.core.app.NotificationCompat;

public class PomodoroForegroundService extends Service {

    private static final String CHANNEL_ID = "PomodoroTimerChannel";
    private static final int NOTIFICATION_ID = 1;
    public static final String ACTION_UPDATE = "AntharLin.Prodomo.ACTION_UPDATE";
    private static final String TAG = "PomodoroService";

    private Handler handler;
    private Runnable runnable;
    private int secondsLeft = 0;
    private String currentTitle = "Pomodoro Timer";
    private String currentText = "Running in background...";

    @Override
    public void onCreate() {
        super.onCreate();
        handler = new Handler(Looper.getMainLooper());
        runnable = new Runnable() {
            @Override
            public void run() {
                if (secondsLeft > 0) {
                    secondsLeft--;
                    updateNotification();
                    handler.postDelayed(this, 1000);
                } else {
                    // Timer finished, stop the service
                    stopSelf();
                }
            }
        };
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            if (ACTION_UPDATE.equals(action)) {
                // Update command
                currentTitle = intent.getStringExtra("title");
                currentText = intent.getStringExtra("text");
                secondsLeft = intent.getIntExtra("secondsLeft", secondsLeft);
                updateNotification();
            } else {
                // Start command
                currentTitle = intent.getStringExtra("title");
                currentText = intent.getStringExtra("text");
                secondsLeft = intent.getIntExtra("secondsLeft", 0);
                
                createNotificationChannel();
                Notification notification = buildNotification();
                startForeground(NOTIFICATION_ID, notification);

                // Start the internal timer logic
                handler.removeCallbacks(runnable);
                if (secondsLeft > 0) {
                    handler.post(runnable);
                }
            }
        }
        return START_STICKY;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Pomodoro Timer Service Channel",
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(serviceChannel);
        }
    }

    private Notification buildNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(this,
                0, notificationIntent, PendingIntent.FLAG_IMMUTABLE);

        String timeString = String.format("%02d:%02d", secondsLeft / 60, secondsLeft % 60);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(currentTitle)
                .setContentText(currentText + " - " + timeString)
                .setSmallIcon(R.drawable.ic_launcher_foreground) // Use a default icon
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .build();
    }

    private void updateNotification() {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        manager.notify(NOTIFICATION_ID, buildNotification());
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        handler.removeCallbacks(runnable);
        Log.d(TAG, "Foreground Service Destroyed");
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
