import { WebSocketServer, WebSocket } from "ws";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "persisted_requests.json");

// Load initially saved requests if they exist
let persistedRequests = [];
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    persistedRequests = JSON.parse(raw);
    console.log(`Loaded ${persistedRequests.length} requests from disk`);
  }
} catch (e) {
  console.error("Failed to load persisted requests:", e);
}

function saveRequests() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(persistedRequests, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write requests to disk:", e);
  }
}

const wss = new WebSocketServer({ port: 8080 });

console.log("WebSocket relay server running on ws://localhost:8080");

wss.on("connection", (ws) => {
  console.log("Client connected");

  // On connection, send all current persisted requests to the client so they load them
  if (persistedRequests.length > 0) {
    ws.send(JSON.stringify({
      type: "INITIAL_REQUESTS_LOAD",
      requests: persistedRequests
    }));
  }

  ws.on("message", (message) => {
    try {
      const text = message.toString();
      const parsed = JSON.parse(text);
      console.log(`Relaying message of type: ${parsed.type}`);

      // Handle persistence based on message types
      if (parsed.type === "NEW_FLIGHT_REQUEST") {
        const req = parsed.request;
        // Check if already exists, else append
        if (!persistedRequests.some((r) => r.id === req.id)) {
          persistedRequests.push(req);
          saveRequests();
          console.log(`Persisted new request: ${req.id}`);
        }
      } else if (parsed.type === "REVIEW_FLIGHT_REQUEST") {
        const { requestId, status, reviewerNotes } = parsed;
        const req = persistedRequests.find((r) => r.id === requestId);
        if (req) {
          req.status = status;
          if (reviewerNotes !== undefined) {
            req.reviewerNotes = reviewerNotes;
          }
          saveRequests();
          console.log(`Updated request ${requestId} status to: ${status}`);
        }
      } else if (parsed.type === "DEACTIVATE_FLIGHT") {
        // Find request matching this flight id and remove or complete it
        const reqId = parsed.flightId.replace("flight", "req");
        const req = persistedRequests.find((r) => r.id === reqId);
        if (req) {
          req.status = "REJECTED";
          saveRequests();
          console.log(`Deactivated request/flight: ${reqId}`);
        }
      }

      // Broadcast to all other connected clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(text);
        }
      });
    } catch (err) {
      console.error("Error processing message:", err);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
