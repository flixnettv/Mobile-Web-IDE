package com.webide

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.webkit.*
import android.widget.ProgressBar
import android.widget.RelativeLayout
import android.widget.TextView
import android.graphics.Color
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat

class MainActivity : AppCompatActivity() {

    companion object {
        // ─── Change this URL to your deployed server ───────────────────────
        // Emulator:        http://10.0.2.2:3000
        // Same-WiFi device: http://192.168.x.x:3000
        // Production:       https://your-domain.com
        private const val SERVER_URL = "http://10.0.2.2:3000"
    }

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Edge-to-edge full screen
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.parseColor("#0F172A")
        window.navigationBarColor = Color.parseColor("#0F172A")

        // Root layout
        val root = RelativeLayout(this).apply {
            setBackgroundColor(Color.parseColor("#0F172A"))
        }

        // Progress bar (loading indicator)
        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            id = View.generateViewId()
            layoutParams = RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.MATCH_PARENT, 6
            ).apply { addRule(RelativeLayout.ALIGN_PARENT_TOP) }
            progressDrawable.setColorFilter(
                Color.parseColor("#3B82F6"),
                android.graphics.PorterDuff.Mode.SRC_IN
            )
            max = 100
        }

        // WebView
        webView = WebView(this).apply {
            layoutParams = RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.MATCH_PARENT,
                RelativeLayout.LayoutParams.MATCH_PARENT
            )

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                useWideViewPort = true
                loadWithOverviewMode = true
                setSupportZoom(true)
                builtInZoomControls = false
                displayZoomControls = false
                allowFileAccess = false
                databaseEnabled = true
                cacheMode = WebSettings.LOAD_DEFAULT
                mediaPlaybackRequiresUserGesture = false
                // Required for Monaco editor
                javaScriptCanOpenWindowsAutomatically = true
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            }

            webViewClient = object : WebViewClient() {
                override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                    progressBar.visibility = View.VISIBLE
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    progressBar.visibility = View.GONE
                }

                override fun onReceivedError(
                    view: WebView?, request: WebResourceRequest?,
                    error: WebResourceError?
                ) {
                    // Show friendly offline page
                    view?.loadData(
                        """<html><body style="background:#0f172a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center">
                            <div><h2>⚡ Connection Error</h2>
                            <p style="color:#64748b">Make sure the IDE server is running at:<br>
                            <code style="color:#60a5fa">$SERVER_URL</code></p>
                            <button onclick="location.reload()" style="background:#3b82f6;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:16px;cursor:pointer;margin-top:16px">
                            Retry</button></div></body></html>""",
                        "text/html", "UTF-8"
                    )
                }

                override fun shouldOverrideUrlLoading(
                    view: WebView?, request: WebResourceRequest?
                ): Boolean {
                    val url = request?.url?.toString() ?: return false
                    // Allow navigation within our server only
                    return !url.startsWith(SERVER_URL)
                }
            }

            webChromeClient = object : WebChromeClient() {
                override fun onProgressChanged(view: WebView?, newProgress: Int) {
                    progressBar.progress = newProgress
                    if (newProgress == 100) progressBar.visibility = View.GONE
                }
            }

            // Restore state if activity recreated
            savedInstanceState?.let { restoreState(it) }
        }

        root.addView(progressBar)
        root.addView(webView)
        setContentView(root)

        if (savedInstanceState == null) {
            webView.loadUrl(SERVER_URL)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack()
        else super.onBackPressed()
    }
}
