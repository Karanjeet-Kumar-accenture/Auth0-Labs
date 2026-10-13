require("dotenv").config();

const express = require("express");
const cors = require("cors");
const {
  auth,
  requiredScopes,
} = require("express-oauth2-jwt-bearer");

const app = express();

app.use(cors());
app.use(express.json());

const checkJwt = auth({
  audience: process.env.AUDIENCE,
  issuer: process.env.ISSUER_BASE_URL,
  tokenSigningAlg: "RS256",
});

app.get("/", (req, res) => {
  res.send("Orders API is running");
});

app.get(
  "/orders",
  checkJwt,
  requiredScopes("read:orders"),
  (req, res) => {
    res.json({
      message: "Access granted",
      orders: [
        { id: 1, item: "Laptop" },
        { id: 2, item: "Keyboard" },
      ],
    });
  }
);

// Handle authorization and token errors
app.use((err, req, res, next) => {
  if (err.status === 401) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "A valid access token is required",
    });
  }

  if (err.status === 403) {
    return res.status(403).json({
      error: "Forbidden",
      message: "The required permission is missing",
    });
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
