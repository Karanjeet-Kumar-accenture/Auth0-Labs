
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { auth } = require("express-oauth2-jwt-bearer");

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type"],
}));

app.use(express.json());

// Validate JWT signature, issuer, audience and expiry.
const checkJwt = auth({
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
  audience: process.env.AUTH0_AUDIENCE,
  tokenSigningAlg: "RS256",
});

// Enforce a permission from the validated access token.
function requirePermission(permission) {
  return (req, res, next) => {
    const permissions = req.auth.payload.permissions || [];

    if (!permissions.includes(permission)) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Missing permission: ${permission}`,
      });
    }

    next();
  };
}

app.get("/", (req, res) => {
  res.json({ message: "Admin Portal API is running" });
});

// Any authenticated user with read:content can view content.
app.get(
  "/content",
  checkJwt,
  requirePermission("read:content"),
  (req, res) => {
    res.json({
      message: "Content loaded successfully",
      content: ["Announcement 1", "Announcement 2"],
    });
  }
);

// Only users with edit:content can edit.
app.post(
  "/content",
  checkJwt,
  requirePermission("edit:content"),
  (req, res) => {
    res.json({
      message: "Content updated successfully",
      content: req.body.content,
    });
  }
);

// Only users with manage:users can manage users.
app.get(
  "/admin/users",
  checkJwt,
  requirePermission("manage:users"),
  (req, res) => {
    res.json({
      message: "Admin access granted",
      users: ["User A", "User B"],
    });
  }
);

// Return clear errors for invalid/missing tokens.
app.use((err, req, res, next) => {
  if (err.status === 401) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "A valid access token is required",
    });
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(`Admin Portal API running on port ${port}`);
});
