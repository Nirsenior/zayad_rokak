package telemetry

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"
)

// TelemetryPayload represents the GPS & battery heartbeat from field devices
type TelemetryPayload struct {
	Latitude          float64   `json:"latitude"`
	Longitude         float64   `json:"longitude"`
	AltitudeMSL       float64   `json:"altitude_msl"`
	AltitudeAGL       float64   `json:"altitude_agl"`
	Heading           float64   `json:"heading"`
	Speed             float64   `json:"speed"`
	BatteryPercentage int       `json:"battery_percentage"`
	SignalStrength    int       `json:"signal_strength_dbm"`
	Timestamp         time.Time `json:"timestamp"`
}

// Client represents a connected user session (Web or Android)
type Client struct {
	ID   string
	Send chan []byte
}

// Gateway manages WS connections and REST ingestion
type Gateway struct {
	mu         sync.RWMutex
	Clients    map[string]*Client
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan []byte
}

func NewGateway() *Gateway {
	g := &Gateway{
		Clients:    make(map[string]*Client),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan []byte),
	}
	go g.run()
	return g
}

func (g *Gateway) run() {
	for {
		select {
		case client := <-g.Register:
			g.mu.Lock()
			g.Clients[client.ID] = client
			g.mu.Unlock()
			log.Printf("Client registered: %s", client.ID)

		case client := <-g.Unregister:
			g.mu.Lock()
			if _, ok := g.Clients[client.ID]; ok {
				delete(g.Clients, client.ID)
				close(client.Send)
			}
			g.mu.Unlock()
			log.Printf("Client unregistered: %s", client.ID)

		case message := <-g.Broadcast:
			g.mu.RLock()
			for _, client := range g.Clients {
				select {
				case client.Send <- message:
				default:
					// If the buffer is full, unregister client to prevent blocking
					go func(c *Client) { g.Unregister <- c }(client)
				}
			}
			g.mu.RUnlock()
		}
	}
}

// IngestPing REST endpoint handler for incoming Android pings
func (g *Gateway) IngestPing(flightID string, payload TelemetryPayload) {
	// 1. Process local updates, save to DB / cache (e.g. Redis)
	// (Simulated logic: convert telemetry to a map update event)

	event := struct {
		EventType string           `json:"event_type"`
		Timestamp time.Time        `json:"timestamp"`
		FlightID  string           `json:"flight_id"`
		Data      TelemetryPayload `json:"payload"`
	}{
		EventType: "DRONE_TELEMETRY_UPDATE",
		Timestamp: time.Now(),
		FlightID:  flightID,
		Data:      payload,
	}

	rawBytes, err := json.Marshal(event)
	if err == nil {
		g.Broadcast <- rawBytes
	}
}

// IngestAlert broadcasts a critical system alert (Tiger/Hammer)
func (g *Gateway) IngestAlert(alertType string, title string, message string) {
	event := struct {
		EventType string    `json:"event_type"`
		Timestamp time.Time `json:"timestamp"`
		Payload   struct {
			Type    string `json:"alert_type"`
			Title   string `json:"title"`
			Message string `json:"message"`
		} `json:"payload"`
	}{
		EventType: "CRITICAL_ALERT",
		Timestamp: time.Now(),
	}
	event.Payload.Type = alertType
	event.Payload.Title = title
	event.Payload.Message = message

	rawBytes, err := json.Marshal(event)
	if err == nil {
		g.Broadcast <- rawBytes
	}
}

// ServeWebSocket handles incoming WS connection requests
func (g *Gateway) ServeWebSocket(w http.ResponseWriter, r *http.Request) {
	// In a real implementation, we would upgrade the connection using gorilla/websocket:
	// conn, err := upgrader.Upgrade(w, r, nil)
	// For this skeleton, we stub out connection registration.

	clientID := r.URL.Query().Get("client_id")
	if clientID == "" {
		http.Error(w, "Missing client_id parameter", http.StatusBadRequest)
		return
	}

	client := &Client{
		ID:   clientID,
		Send: make(chan []byte, 256),
	}
	g.Register <- client

	// Start reading/writing pump loops (simulated)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("WebSocket connection established (skeleton)"))
}
