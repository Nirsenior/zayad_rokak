package com.rokaq.android.ui.map

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.rokaq.android.databinding.FragmentMapBinding
import java.util.UUID

/**
 * Tactical Map Fragment for Field Operators (Alar App)
 * Manages offline maps rendering, transponder ping services, and critical alerts.
 */
class MapFragment : Fragment() {

    private var _binding: FragmentMapBinding? = null
    private val binding get() = _binding!!

    // Simulated background telemetry loops
    private val telemetryHandler = Handler(Looper.getMainLooper())
    private var activeFlightId: String? = null
    private var isTransponderActive = false

    private val telemetryRunnable = object : Runnable {
        override fun run() {
            if (isTransponderActive && activeFlightId != null) {
                sendTelemetryHeartbeat()
                // Ping every 2 seconds as per API specification
                telemetryHandler.postDelayed(this, 2000)
            }
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentMapBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        initializeOfflineMap()
        setupListeners()
    }

    private fun initializeOfflineMap() {
        // Simulating MapLibre/ArcGIS Offline Vector Map setup
        binding.mapStatusText.text = "טוען מפות לא מקוונות (Offline Vector Tiles)..."
        
        Handler(Looper.getMainLooper()).postDelayed({
            if (_binding != null) {
                binding.mapStatusText.text = "מפה מנותקת קשר - מוכנה לעבודה בשטח"
                binding.gpsIndicator.setImageResource(android.R.drawable.presence_online)
            }
        }, 1500)
    }

    private fun setupListeners() {
        // Toggle transponder (telemetry reporting)
        binding.btnToggleTransponder.setOnClickListener {
            if (!isTransponderActive) {
                startFlightTracking()
            } else {
                stopFlightTracking()
            }
        }
    }

    private fun startFlightTracking() {
        activeFlightId = UUID.randomUUID().toString()
        isTransponderActive = true
        binding.btnToggleTransponder.text = "כבה משדר טלמטרייה (Transponder ON)"
        binding.btnToggleTransponder.setBackgroundColor(0xFFC0392B.toInt()) // Red when active

        // Start pinging loop
        telemetryHandler.post(telemetryRunnable)
        Toast.makeText(context, "משדר טלמטרייה הופעל. הזרמה לשרת החלה", Toast.LENGTH_SHORT).show()
    }

    private fun stopFlightTracking() {
        isTransponderActive = false
        telemetryHandler.removeCallbacks(telemetryRunnable)
        binding.btnToggleTransponder.text = "הפעל משדר טלמטרייה (Transponder OFF)"
        binding.btnToggleTransponder.setBackgroundColor(0xFF27AE60.toInt()) // Green when idle
        activeFlightId = null
        Toast.makeText(context, "משדר טלמטרייה כובה.", Toast.LENGTH_SHORT).show()
    }

    private fun sendTelemetryHeartbeat() {
        // Simulating the REST API Ping payload (POST /api/v1/flights/{id}/ping)
        val lat = 31.8923 + (Math.random() - 0.5) * 0.001
        val lng = 34.8012 + (Math.random() - 0.5) * 0.001
        val altAgl = 45.0
        val battery = 88
        val signalDbm = -75

        // Log locally
        android.util.Log.d("ROKAQ_TELEMETRY", "Ping sent -> Flight: $activeFlightId | Lat: $lat, Lng: $lng | Alt AGL: $altAgl | Battery: $battery% | Signal: $signalDbm dBm")
        
        activity?.runOnUiThread {
            binding.telemetryLogs.text = "משדר: Lat: ${String.format("%.4f", lat)}, Lng: ${String.format("%.4f", lng)} | גובה: ${altAgl}מ' | סוללה: ${battery}%"
        }
    }

    /**
     * Triggered by WebSocket client when a critical alert is broadcasted (Tiger / Hammer)
     */
    fun onCriticalAlertReceived(alertType: String, title: String, message: String) {
        activity?.runOnUiThread {
            // Check alert type and show full-screen overlay if critical
            if (alertType == "TIGER_ALERT" || alertType == "HAMMER_ALERT") {
                showFullScreenAlertOverlay(title, message)
            } else {
                Toast.makeText(context, "$title: $message", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun showFullScreenAlertOverlay(title: String, message: String) {
        // Simulates displaying full screen alert modal
        binding.alertOverlay.visibility = View.VISIBLE
        binding.alertTitle.text = title
        binding.alertMessage.text = message
        
        binding.btnAcknowledgeAlert.setOnClickListener {
            binding.alertOverlay.visibility = View.GONE
            Toast.makeText(context, "התרעה אושרה.", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        telemetryHandler.removeCallbacks(telemetryRunnable)
        _binding = null
    }
}
