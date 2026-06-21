package fusion

import (
	"errors"
	"math"
	"sync"
	"time"
)

// IFFStatus represents the classification status of a track
type IFFStatus string

const (
	BlueCertain    IFFStatus = "BLUE_CERTAIN"
	BlueSuspicious IFFStatus = "BLUE_SUSPICIOUS"
	BlueAnomalous  IFFStatus = "BLUE_ANOMALOUS"
	Unidentified   IFFStatus = "UNIDENTIFIED"
	RedSuspicious  IFFStatus = "RED_SUSPICIOUS"
	RedCertain     IFFStatus = "RED_CERTAIN"
	Conflicting    IFFStatus = "CONFLICTING"
)

// SensorType represents the detecting hardware
type SensorType string

const (
	Radar          SensorType = "RADAR"
	RFFinder       SensorType = "RF_FINDER"
	Optical        SensorType = "OPTICAL"
	ExternalSystem SensorType = "EXTERNAL_SYSTEM"
)

// Coordinates representing WGS84 coordinates
type Coordinates struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Altitude  float64 `json:"altitude_msl"` // altitude in meters above mean sea level
}

// ActiveFlight telemetry representation for correlation
type ActiveFlight struct {
	FlightID       string      `json:"flight_id"`
	DroneID        string      `json:"drone_id"`
	LastPingCoord  Coordinates `json:"last_ping_coord"`
	LastPingTime   time.Time   `json:"last_ping_time"`
	FrequencyReady bool        `json:"frequency_ready"` // is it on a registered military channel
	HasFlightPlan  bool        `json:"has_flight_plan"`  // is it flying inside its approved corridor
}

// SensorDetection represents raw input from local sensors
type SensorDetection struct {
	DetectionID   string      `json:"detection_id"`
	SensorType    SensorType  `json:"sensor_type"`
	TargetTrackID string      `json:"target_track_id"`
	Coordinate    Coordinates `json:"coordinate"`
	Heading       float64     `json:"heading"`
	SpeedMPS      float64     `json:"speed_mps"`
	Timestamp     time.Time   `json:"timestamp"`
}

// Track represents a consolidated operational track in the air picture
type Track struct {
	TrackID             string       `json:"track_id"`
	Coordinates         Coordinates  `json:"coordinates"`
	Heading             float64      `json:"heading"`
	SpeedMPS            float64      `json:"speed_mps"`
	IFFStatus           IFFStatus    `json:"iff_status"`
	CertaintyLevel      float64      `json:"certainty_level"` // 0.0 to 1.0
	LastSeen            time.Time    `json:"last_seen"`
	AssociatedFlightID  string       `json:"associated_flight_id,omitempty"`
	ConflictingSignals  bool         `json:"conflicting_signals"`
	HasVisualFriend     bool         `json:"has_visual_friend"` // Ground confirmation "Green in Eyes"
	HasHostileSignature bool         `json:"has_hostile_signature"`
}

// FusionEngine manages the live tracks and active flights cache
type FusionEngine struct {
	mu            sync.RWMutex
	ActiveTracks  map[string]*Track
	ActiveFlights map[string]*ActiveFlight
}

func NewFusionEngine() *FusionEngine {
	return &FusionEngine{
		ActiveTracks:  make(map[string]*Track),
		ActiveFlights: make(map[string]*ActiveFlight),
	}
}

// Distance Calculates the flat Euclidean distance in meters between two coordinates (approximation)
func Distance(c1, c2 Coordinates) float64 {
	const EarthRadius = 6371000.0 // meters
	radLat1 := c1.Latitude * math.Pi / 180.0
	radLat2 := c2.Latitude * math.Pi / 180.0
	diffLat := (c2.Latitude - c1.Latitude) * math.Pi / 180.0
	diffLng := (c2.Longitude - c1.Longitude) * math.Pi / 180.0

	a := math.Sin(diffLat/2)*math.Sin(diffLat/2) +
		math.Cos(radLat1)*math.Cos(radLat2)*
			math.Sin(diffLng/2)*math.Sin(diffLng/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return EarthRadius * c
}

// IngestSensorDetection aggregates and correlates raw sensor input into active tracks
func (fe *FusionEngine) IngestSensorDetection(detection SensorDetection) *Track {
	fe.mu.Lock()
	defer fe.mu.Unlock()

	// 1. Attempt to correlate with an active flight (telemetry ping)
	var matchedFlight *ActiveFlight
	minDist := 50.0 // threshold of 50 meters
	for _, flight := range fe.ActiveFlights {
		// Verify ping is recent (last 3 seconds)
		if time.Since(flight.LastPingTime) > 3*time.Second {
			continue
		}

		dist := Distance(detection.Coordinate, flight.LastPingCoord)
		altDiff := math.Abs(detection.Coordinate.Altitude - flight.LastPingCoord.Altitude)

		// Check if within spatial correlation buffer (50m horizontal, 15m vertical)
		if dist < minDist && altDiff < 15.0 {
			minDist = dist
			matchedFlight = flight
		}
	}

	// 2. Load or create the track
	track, exists := fe.ActiveTracks[detection.TargetTrackID]
	if !exists {
		track = &Track{
			TrackID:   detection.TargetTrackID,
			LastSeen:  detection.Timestamp,
			IFFStatus: Unidentified,
		}
		fe.ActiveTracks[detection.TargetTrackID] = track
	}

	// Update coordinates and motion vectors
	track.Coordinates = detection.Coordinate
	track.Heading = detection.Heading
	track.SpeedMPS = detection.SpeedMPS
	track.LastSeen = detection.Timestamp

	// If matched with a friendly flight plan, associate
	if matchedFlight != nil {
		track.AssociatedFlightID = matchedFlight.FlightID
	} else {
		track.AssociatedFlightID = ""
	}

	// 3. Compute IFF and Certainty score
	track.IFFStatus, track.CertaintyLevel = fe.CalculateCertaintyScore(track, matchedFlight, &detection)

	return track
}

// CalculateCertaintyScore evaluates features and returns IFF status and confidence score (0.0 to 1.0)
func (fe *FusionEngine) CalculateCertaintyScore(track *Track, flight *ActiveFlight, detection *SensorDetection) (IFFStatus, float64) {
	score := 0.50 // neutral baseline

	// Ground visual confirmation "Green in Eyes" gives positive score
	if track.HasVisualFriend {
		score += 0.20
	}

	// Hostile signature detected (RF analysis or optical classification) gives heavy negative score
	if track.HasHostileSignature {
		score -= 0.50
	}

	// Check speed anomaly
	if detection != nil && detection.SpeedMPS > 27.7 { // > 100 km/h is anomalous for friendly tactical copters
		score -= 0.30
	}

	// Correlate with active telemetry transponder
	if flight != nil {
		score += 0.40 // telemetry ping match

		if flight.HasFlightPlan {
			score += 0.25 // flight plan matches path
		}

		if flight.FrequencyReady {
			score += 0.15 // encrypted frequency matches
		}
	}

	// Clamp score between 0.0 and 1.0
	if score > 1.0 {
		score = 1.0
	} else if score < 0.0 {
		score = 0.0
	}

	// Check for conflicting signals edge case (e.g. valid telemetry ping but hostile RF/Optical signature)
	if flight != nil && track.HasHostileSignature {
		track.ConflictingSignals = true
		return Conflicting, 0.50
	}

	// Classify status based on score thresholds
	switch {
	case score >= 0.85:
		return BlueCertain, score
	case score >= 0.65 && score < 0.85:
		return BlueSuspicious, score
	case score >= 0.55 && score < 0.65:
		return BlueAnomalous, score
	case score >= 0.40 && score < 0.55:
		return Unidentified, score
	case score >= 0.20 && score < 0.40:
		return RedSuspicious, score
	default:
		return RedCertain, score
	}
}

// ReportGreenInEyes registers ground confirmation of friendliness
func (fe *FusionEngine) ReportGreenInEyes(trackID string) error {
	fe.mu.Lock()
	defer fe.mu.Unlock()

	track, exists := fe.ActiveTracks[trackID]
	if !exists {
		return errors.New("track not found")
	}

	track.HasVisualFriend = true
	// Force recalculate
	track.IFFStatus, track.CertaintyLevel = fe.CalculateCertaintyScore(track, nil, nil)
	return nil
}

// CleanupStaleTracks removes active tracks that have not been updated for 30 seconds
func (fe *FusionEngine) CleanupStaleTracks(retentionLimit time.Duration) int {
	fe.mu.Lock()
	defer fe.mu.Unlock()

	removedCount := 0
	now := time.Now()
	for id, track := range fe.ActiveTracks {
		if now.Sub(track.LastSeen) > retentionLimit {
			delete(fe.ActiveTracks, id)
			removedCount++
		}
	}
	return removedCount
}
