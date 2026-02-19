package com.xianshuyouzhi.app;

import android.content.Context;
import android.content.res.Configuration;
import android.util.DisplayMetrics;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

	private void enforceFontScale() {
		Configuration configuration = getResources().getConfiguration();
		if (configuration.fontScale != 1.0f) {
			configuration.fontScale = 1.0f;
			DisplayMetrics metrics = getResources().getDisplayMetrics();
			getResources().updateConfiguration(configuration, metrics);
		}
	}

	@Override
	protected void attachBaseContext(Context newBase) {
		Configuration configuration = new Configuration(newBase.getResources().getConfiguration());
		configuration.fontScale = 1.0f;
		Context context = newBase.createConfigurationContext(configuration);
		super.attachBaseContext(context);
	}

	@Override
	protected void onCreate(android.os.Bundle savedInstanceState) {
		enforceFontScale();
		super.onCreate(savedInstanceState);
		enforceFontScale();
	}

	@Override
	public void onConfigurationChanged(Configuration newConfig) {
		if (newConfig != null) {
			newConfig.fontScale = 1.0f;
		}
		super.onConfigurationChanged(newConfig);
		enforceFontScale();
	}
}
