package com.rokaq.android.ui.request

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.rokaq.android.databinding.FragmentFlightRequestFormBinding

/**
 * Quick 3-Tap Flight Request Form for Field Drone Operators.
 * Submits flight plans to the Rokaq backend and handles immediate approval/conflict feedback.
 */
class FlightRequestForm : Fragment() {

    private var _binding: FragmentFlightRequestFormBinding? = null
    private val binding get() = _binding!!

    // Predefined mission templates for the 3-tap flow
    private val missionProfiles = arrayOf(
        "סיור קו מגע (גובה 30מ', רדיוס 300מ', 15 דק')",
        "תצפית הגנה היקפית (גובה 50מ', רדיוס 500מ', 30 דק')",
        "סריקת תא שטח נקודתית (גובה 80מ', רדיוס 1ק\"מ, 45 דק')"
    )

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentFlightRequestFormBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupTemplateSelector()
        setupListeners()
    }

    private fun setupTemplateSelector() {
        val adapter = context?.let {
            ArrayAdapter(it, android.R.layout.simple_spinner_item, missionProfiles)
        }
        adapter?.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerMissionTemplates.adapter = adapter
    }

    private fun setupListeners() {
        binding.btnSubmitRequest.setOnClickListener {
            val selectedProfileIndex = binding.spinnerMissionTemplates.selectedItemPosition
            val isCustomFrequencies = binding.chkAlternativeFreq.isChecked
            
            submitFlightRequest(selectedProfileIndex, isCustomFrequencies)
        }
    }

    private fun submitFlightRequest(profileIndex: Int, useAlternativeFreq: Boolean) {
        binding.progressBarSubmit.visibility = View.VISIBLE
        binding.btnSubmitRequest.isEnabled = false

        // Simulate API call (POST /api/v1/flight-requests)
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            if (_binding != null) {
                binding.progressBarSubmit.visibility = View.GONE
                binding.btnSubmitRequest.isEnabled = true

                // Logic based on profile indices to simulate auto-approvals and conflicts
                when (profileIndex) {
                    0 -> handleRequestApproved() // Simple profile -> Auto approved
                    1 -> {
                        if (useAlternativeFreq) {
                            handleRequestApproved() // Using clear frequency -> approved
                        } else {
                            handleRequestPendingReview("חסימת ספקטרום פעילה בגזרה בתדר 5.8GHz. הבקשה הועברה לבחינת קצין רוק''ק.")
                        }
                    }
                    2 -> handleRequestPendingReview("הנתיב המבוקש חוצה שטח אימונים חטיבתי פעיל. נדרש אישור ידני.")
                }
            }
        }, 1200)
    }

    private fun handleRequestApproved() {
        binding.statusCard.visibility = View.VISIBLE
        binding.statusCard.setBackgroundColor(0xFF27AE60.toInt()) // Green background
        binding.statusTitle.text = "אושר אוטומטית (APPROVED)"
        binding.statusMessage.text = "נתיב הטיסה נקי מקונפליקטים. רשאי להמריא. תוקף: 30 דקות הקרובות."
        
        Toast.makeText(context, "תוכנית הטיסה אושרה בהצלחה!", Toast.LENGTH_SHORT).show()
    }

    private fun handleRequestPendingReview(conflictDescription: String) {
        binding.statusCard.visibility = View.VISIBLE
        binding.statusCard.setBackgroundColor(0xFFE67E22.toInt()) // Orange background
        binding.statusTitle.text = "ממתין לבדיקת קצין (PENDING REVIEW)"
        binding.statusMessage.text = conflictDescription
        
        Toast.makeText(context, "נמצא קונפליקט. ממתין לאישור רוק''ק.", Toast.LENGTH_LONG).show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
