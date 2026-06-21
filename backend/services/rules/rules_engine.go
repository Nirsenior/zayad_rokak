package rules

import (
	"math"
	"time"
)

// Point2D represents a flat latitude/longitude coordinate
type Point2D struct {
	X float64 // Longitude
	Y float64 // Latitude
}

// Polygon represents a list of coordinates forming a closed boundary
type Polygon []Point2D

// Point3D represents a point with altitude
type Point3D struct {
	X float64 // Longitude
	Y float64 // Latitude
	Z float64 // Altitude (AGL)
}

// LineString3D represents a 3D flight path
type LineString3D []Point3D

// ConflictType describes the category of deconfliction violation
type ConflictType string

const (
	ConflictNFZ        ConflictType = "NO_FLY_ZONE_VIOLATION"
	ConflictFlightPath ConflictType = "FLIGHT_PATH_COLLISION"
	ConflictSpectrum   ConflictType = "SPECTRUM_JAMMING_WARNING"
)

// ConflictDetail describes a single resolved/detected conflict
type ConflictDetail struct {
	Type        ConflictType `json:"type"`
	TargetID    string       `json:"target_id"`
	Description string       `json:"description"`
}

// FlightRequest represents the request submitted for validation
type FlightRequest struct {
	ID             string       `json:"id"`
	Frequencies    []float64    `json:"frequencies"` // GHz
	Route          LineString3D `json:"route"`
	MinAltitudeAGL float64      `json:"min_altitude_agl"`
	MaxAltitudeAGL float64      `json:"max_altitude_agl"`
	StartTime      time.Time    `json:"start_time"`
	EndTime        time.Time    `json:"end_time"`
}

// AirspaceZone represents a pre-existing corridor or NFZ in the database
type AirspaceZone struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Geometry  Polygon   `json:"geometry"`
	MinAlt    float64   `json:"min_alt"`
	MaxAlt    float64   `json:"max_alt"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
	IsNFZ     bool      `json:"is_nfz"`
}

// JammingZone represents an active EW jamming sector
type JammingZone struct {
	ID                string       `json:"id"`
	Name              string       `json:"name"`
	Geometry          Polygon      `json:"geometry"`
	BlockedFreqRanges [][2]float64 `json:"blocked_freq_ranges"` // e.g. [ [2.400, 2.485] ]
	StartTime         time.Time    `json:"start_time"`
	EndTime           time.Time    `json:"end_time"`
}

// RayCasting Algorithm to check if Point is inside Polygon
func PointInPolygon(pt Point2D, poly Polygon) bool {
	n := len(poly)
	if n < 3 {
		return false
	}

	inside := false
	p1 := poly[0]
	for i := 1; i <= n; i++ {
		p2 := poly[i%n]
		if pt.Y > math.Min(p1.Y, p2.Y) {
			if pt.Y <= math.Max(p1.Y, p2.Y) {
				if pt.X <= math.Max(p1.X, p2.X) {
					var xIntersection float64
					if p1.Y != p2.Y {
						xIntersection = (pt.Y-p1.Y)*(p2.X-p1.X)/(p2.Y-p1.Y) + p1.X
					}
					if p1.X == p2.X || pt.X <= xIntersection {
						inside = !inside
					}
				}
			}
		}
		p1 = p2
	}
	return inside
}

// Checks if two Line Segments intersect
func LineSegmentsIntersect(a, b, c, d Point2D) bool {
	det := (b.X-a.X)*(d.Y-c.Y) - (b.Y-a.Y)*(d.X-c.X)
	if math.Abs(det) < 1e-9 {
		return false // Parallel lines
	}

	u := ((c.X-a.X)*(d.Y-c.Y) - (c.Y-a.Y)*(d.X-c.X)) / det
	v := ((c.X-a.X)*(b.Y-a.Y) - (c.Y-a.Y)*(b.X-a.X)) / det

	return u >= 0 && u <= 1 && v >= 0 && v <= 1
}

// LineIntersectsPolygon checks if a route line segment cuts through a polygon boundary
func LineIntersectsPolygon(p1, p2 Point2D, poly Polygon) bool {
	n := len(poly)
	for i := 0; i < n; i++ {
		q1 := poly[i]
		q2 := poly[(i+1)%n]
		if LineSegmentsIntersect(p1, p2, q1, q2) {
			return true
		}
	}
	// Check if the entire line segment is inside the polygon
	if PointInPolygon(p1, poly) || PointInPolygon(p2, poly) {
		return true
	}
	return false
}

// ValidateFlightPlan runs geometric and frequency checks
func ValidateFlightPlan(req FlightRequest, zones []AirspaceZone, jammers []JammingZone) (string, []ConflictDetail) {
	var conflicts []ConflictDetail

	// 1. Time window overlapping filter helper
	timeOverlap := func(start1, end1, start2, end2 time.Time) bool {
		return start1.Before(end2) && end1.After(start2)
	}

	// 2. Altitude overlapping filter helper
	altOverlap := func(min1, max1, min2, max2 float64) bool {
		return min1 <= max2 && max1 >= min2
	}

	for _, zone := range zones {
		// Only check if times overlap
		if !timeOverlap(req.StartTime, req.EndTime, zone.StartTime, zone.EndTime) {
			continue
		}

		// Check spatial overlap (2D projection first)
		intersects := false
		for i := 0; i < len(req.Route)-1; i++ {
			pt1 := Point2D{X: req.Route[i].X, Y: req.Route[i].Y}
			pt2 := Point2D{X: req.Route[i+1].X, Y: req.Route[i+1].Y}
			if LineIntersectsPolygon(pt1, pt2, zone.Geometry) {
				intersects = true
				break
			}
		}

		if !intersects {
			continue
		}

		// If it's a hard No Fly Zone (NFZ), any altitude intersection is blocked
		if zone.IsNFZ {
			conflicts = append(conflicts, ConflictDetail{
				Type:        ConflictNFZ,
				TargetID:    zone.ID,
				Description: "הנתיב המבוקש חוצה שטח אסור לטיסה (NFZ): " + zone.Name,
			})
			continue
		}

		// If it's a regular corridor, check if altitudes also overlap (3D collision)
		if altOverlap(req.MinAltitudeAGL, req.MaxAltitudeAGL, zone.MinAlt, zone.MaxAlt) {
			conflicts = append(conflicts, ConflictDetail{
				Type:        ConflictFlightPath,
				TargetID:    zone.ID,
				Description: "חפיפת מרחב אווירי וגובה מול נתיב מורשה פעיל: " + zone.Name,
			})
		}
	}

	// 3. Check for spectrum/frequency jamming conflicts
	for _, jammer := range jammers {
		if !timeOverlap(req.StartTime, req.EndTime, jammer.StartTime, jammer.EndTime) {
			continue
		}

		// Check spatial overlap
		intersects := false
		for i := 0; i < len(req.Route)-1; i++ {
			pt1 := Point2D{X: req.Route[i].X, Y: req.Route[i].Y}
			pt2 := Point2D{X: req.Route[i+1].X, Y: req.Route[i+1].Y}
			if LineIntersectsPolygon(pt1, pt2, jammer.Geometry) {
				intersects = true
				break
			}
		}

		if !intersects {
			continue
		}

		// Check if drone frequencies are within blocked ranges
		for _, reqFreq := range req.Frequencies {
			for _, blockedRange := range jammer.BlockedFreqRanges {
				if reqFreq >= blockedRange[0] && reqFreq <= blockedRange[1] {
					conflicts = append(conflicts, ConflictDetail{
						Type:        ConflictSpectrum,
						TargetID:    jammer.ID,
						Description: "אזהרת ספקטרום: הנתיב חוצה אזור ל''א פעיל החוסם תדר " + jammer.Name,
					})
					break
				}
			}
		}
	}

	// 4. Return classification status based on rules
	if len(conflicts) == 0 {
		return "GREEN", nil
	}

	// If there is any hard NFZ violation, classify as RED
	for _, c := range conflicts {
		if c.Type == ConflictNFZ {
			return "RED", conflicts
		}
	}

	// Otherwise, it has warnings or mild corridor overlaps - classify as ORANGE
	return "ORANGE", conflicts
}
