// example.js
const fs = require("fs");
const tls = require("tls");
const { execSync } = require("child_process");
const GURTServer = require("./gurt-server");

const path = require("path");



// --- Pre-flight cert sanity checks ---
function checkCertificates(keyPath, certPath) {
  console.log("[CERT] Checking certificate and key...");

  try {
    // Verify that files exist
    if (!fs.existsSync(keyPath)) throw new Error(`Missing key file: ${keyPath}`);
    if (!fs.existsSync(certPath)) throw new Error(`Missing cert file: ${certPath}`);

    // Print cert info
    const certInfo = execSync(`openssl x509 -in "${certPath}" -noout -text`);
    console.log("[CERT] Certificate details:\n" + certInfo.toString());

    // Check key matches cert
    try {
      execSync(`openssl x509 -noout -modulus -in "${certPath}" | openssl md5`);
      execSync(`openssl rsa -noout -modulus -in "${keyPath}" | openssl md5`);
      console.log("[CERT] Cert and key appear to match.");
    } catch (e) {
      console.error("[CERT ERROR] Cert and key do not match!");
    }
  } catch (err) {
    console.error("[CERT ERROR] " + err.message);
  }
}

checkCertificates("gurtjs.web.key", "gurtjs.web.crt");

// --- Start GURT server ---
const server = new GURTServer({
  tls: {
    key: fs.readFileSync("gurtjs.web.key"),
    cert: fs.readFileSync("gurtjs.web.crt"),
  },
  isServer: true,
  forceServername: "gurtjs.web",
  debug: true,
  isLocalCert: false,
  requestCert: false,       // do not require client certificate
  rejectUnauthorized: false // accept unverified clients
});

// Add TLS debug hooks
server.on("tls-error", (addr, err) => {
  console.error(`[TLS ERROR] ${addr} -> ${err.message}`);
  if (err.message.includes("bad certificate")) {
    console.error(
      "[HINT] The client rejected your certificate. " +
        "This usually means the intermediate certificates are missing.\n" +
        "Try creating a fullchain.pem by concatenating your domain cert and CA intermediates:\n\n" +
        "   copy face.web.crt+intermediate.pem fullchain.pem\n\n" +
        "Then use fullchain.pem instead of face.web.crt."
    );
  }
});

server.on("tls-handshake", (addr, socket) => {
  console.log(`[TLS OK] Secure handshake with ${addr}`);
  const peerCert = socket.getPeerCertificate();
  console.log("[TLS] Peer certificate:", peerCert);
  console.log("[TLS] Protocol:", socket.getProtocol());
});

// --- Routes ---
// GET route
server.get("/", ({ socket }) => {
  const body = fs.readFileSync("index.html", "utf8");
  socket.write(
    `GURT/1.0.0 200 OK\r\ncontent-type: text/plain\r\ncontent-length: ${Buffer.byteLength(
      body
    )}\r\nserver: GURT/1.0.0\r\n\r\n${body}`
  );
});


server.get("/assets/image.png", ({ socket }) => {
  const body = fs.readFileSync(path.join(__dirname,  "assets/image.png"), "utf8"); //fs.readFileSync(path.replace("assets/", ""), "utf8");
  socket.write(
    `GURT/1.0.0 200 OK\r\ncontent-type: text/plain\r\ncontent-length: ${Buffer.byteLength(
      body
    )}\r\nserver: GURT/1.0.0\r\n\r\n${body}`
  );
});

// POST route
server.post("/submit", ({ socket, body }) => {
  console.log("[POST body]", body.trim());
  const resBody = "POST received";
  socket.write(
    `GURT/1.0.0 200 OK\r\ncontent-type: text/plain\r\ncontent-length: ${Buffer.byteLength(
      resBody
    )}\r\nserver: GURT/1.0.0\r\n\r\n${resBody}`
  );
});



// PATCH route
server.patch("/update", ({ socket, body }) => {
  console.log("[PATCH body]", body.trim());
  const resBody = "PATCH received";
  socket.write(
    `GURT/1.0.0 200 OK\r\ncontent-type: text/plain\r\ncontent-length: ${Buffer.byteLength(
      resBody
    )}\r\nserver: GURT/1.0.0\r\n\r\n${resBody}`
  );
});

// OPTIONS route
server.options("/", ({ socket }) => {
  const response =
    `GURT/1.0.0 204 No Content\r\n` +
    "allow: GET, POST, PATCH, OPTIONS, HEAD\r\n" +
    "server: GURT/1.0.0\r\n\r\n";
  socket.write(response);
});

// HEAD route
server.head("/", ({ socket }) => {
  const response =
    `GURT/1.0.0 200 OK\r\n` +
    "content-type: text/plain\r\n" +
    `content-length: 11\r\n` + // matches Hello World
    "server: GURT/1.0.0\r\n\r\n";
  socket.write(response);
});

// Start the server
server.listen(4878, () => {
  console.log("GURT server listening on port 4878");
});
