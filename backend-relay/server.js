import { WebSocketServer, WebSocket } from "ws";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "persisted_requests.json");
const ANTENNA_DATA_FILE = path.join(__dirname, "persisted_antennas.json");
const SPACE_AREA_DATA_FILE = path.join(__dirname, "persisted_space_areas.json");

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

// Load initially saved RF antennas if they exist
let persistedAntennas = [];
try {
  if (fs.existsSync(ANTENNA_DATA_FILE)) {
    const raw = fs.readFileSync(ANTENNA_DATA_FILE, "utf-8");
    persistedAntennas = JSON.parse(raw);
    console.log(`Loaded ${persistedAntennas.length} antennas from disk`);
  }
} catch (e) {
  console.error("Failed to load persisted antennas:", e);
}

function saveAntennas() {
  try {
    fs.writeFileSync(ANTENNA_DATA_FILE, JSON.stringify(persistedAntennas, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write antennas to disk:", e);
  }
}

// Load initially saved ארגון המרחב (space organization) areas if they exist
let persistedSpaceAreas = [];
try {
  if (fs.existsSync(SPACE_AREA_DATA_FILE)) {
    const raw = fs.readFileSync(SPACE_AREA_DATA_FILE, "utf-8");
    persistedSpaceAreas = JSON.parse(raw);
    console.log(`Loaded ${persistedSpaceAreas.length} space areas from disk`);
  }
} catch (e) {
  console.error("Failed to load persisted space areas:", e);
}

function saveSpaceAreas() {
  try {
    fs.writeFileSync(SPACE_AREA_DATA_FILE, JSON.stringify(persistedSpaceAreas, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write space areas to disk:", e);
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

  if (persistedAntennas.length > 0) {
    ws.send(JSON.stringify({
      type: "INITIAL_ANTENNAS_LOAD",
      antennas: persistedAntennas
    }));
  }

  if (persistedSpaceAreas.length > 0) {
    ws.send(JSON.stringify({
      type: "INITIAL_SPACE_AREAS_LOAD",
      spaceAreas: persistedSpaceAreas
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
        const { requestId, status, reviewerNotes, droneLogs } = parsed;
        const req = persistedRequests.find((r) => r.id === requestId);
        if (req) {
          req.status = status;
          if (reviewerNotes !== undefined) req.reviewerNotes = reviewerNotes;
          if (droneLogs !== undefined) req.droneLogs = droneLogs;
          saveRequests();
          console.log(`Updated request ${requestId} status to: ${status}`);
        }
      } else if (parsed.type === "UPDATE_FLIGHT_REQUEST") {
        // Full request update from operator (edit mode)
        const { request } = parsed;
        const idx = persistedRequests.findIndex((r) => r.id === request.id);
        if (idx !== -1) {
          persistedRequests[idx] = { ...persistedRequests[idx], ...request };
        } else {
          persistedRequests.push(request);
        }
        saveRequests();
        console.log(`Full update for request: ${request.id}`);
      } else if (parsed.type === "DEACTIVATE_FLIGHT") {
        // Find request matching this flight id and remove or complete it
        const reqId = parsed.flightId.replace("flight", "req");
        const req = persistedRequests.find((r) => r.id === reqId);
        if (req) {
          req.status = "REJECTED";
          saveRequests();
          console.log(`Deactivated request/flight: ${reqId}`);
        }
      } else if (parsed.type === "ANTENNA_UPSERT") {
        const ant = parsed.antenna;
        const idx = persistedAntennas.findIndex((a) => a.id === ant.id);
        if (idx !== -1) {
          persistedAntennas[idx] = ant;
        } else {
          persistedAntennas.push(ant);
        }
        saveAntennas();
        console.log(`Upserted antenna: ${ant.id}`);
      } else if (parsed.type === "ANTENNA_REMOVE") {
        persistedAntennas = persistedAntennas.filter((a) => a.id !== parsed.antennaId);
        saveAntennas();
        console.log(`Removed antenna: ${parsed.antennaId}`);
      } else if (parsed.type === "SPACE_AREA_UPSERT") {
        const area = parsed.spaceArea;
        const idx = persistedSpaceAreas.findIndex((a) => a.id === area.id);
        if (idx !== -1) {
          persistedSpaceAreas[idx] = area;
        } else {
          persistedSpaceAreas.push(area);
        }
        saveSpaceAreas();
        console.log(`Upserted space area: ${area.id}`);
      } else if (parsed.type === "SPACE_AREA_REMOVE") {
        persistedSpaceAreas = persistedSpaceAreas.filter((a) => a.id !== parsed.spaceAreaId);
        saveSpaceAreas();
        console.log(`Removed space area: ${parsed.spaceAreaId}`);
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
