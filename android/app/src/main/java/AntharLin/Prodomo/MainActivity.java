package AntharLin.Prodomo;

import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import AntharLin.Prodomo.FloatingWindowPlugin;
import AntharLin.Prodomo.ForegroundServicePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(FloatingWindowPlugin.class);
        registerPlugin(ForegroundServicePlugin.class);

        // Keep the screen on while the app is in the foreground
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }
}
