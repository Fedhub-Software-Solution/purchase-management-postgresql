// backend/src/routes/auth.ts
import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { query, queryOne } from "../database.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";
const TOKEN_TTL_SECONDS = 60 * 60 * 12; // 12h

type Role = "admin" | "employee";

export type User = {
  id: string;
  email: string;
  password_hash: string;
  role: Role;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

/* -----------------------------------------------------------------------------
   Seed default users if missing
----------------------------------------------------------------------------- */
async function seedUsersIfMissing() {
  const adminExists = await queryOne(
    "SELECT id FROM users WHERE email = $1",
    ["admin@fedhubsoftware.com"]
  );

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash("Admin@123", 10);
    await query(
      `INSERT INTO users (email, password_hash, role, name, active)
       VALUES ($1, $2, $3, $4, $5)`,
      ["admin@fedhubsoftware.com", hashedPassword, "admin", "System Admin", true]
    );
    console.log("[auth] Created default admin user");
  }

  const employeeExists = await queryOne(
    "SELECT id FROM users WHERE email = $1",
    ["employee@fedhubsoftware.com"]
  );

  if (!employeeExists) {
    const hashedPassword = await bcrypt.hash("Employee@123", 10);
    await query(
      `INSERT INTO users (email, password_hash, role, name, active)
       VALUES ($1, $2, $3, $4, $5)`,
      ["employee@fedhubsoftware.com", hashedPassword, "employee", "Employee User", true]
    );
    console.log("[auth] Created default employee user");
  }
}

// Seed users on module load
seedUsersIfMissing().catch((err) => {
  console.error("[auth] Error seeding users:", err);
});

/* -----------------------------------------------------------------------------
   Helpers
----------------------------------------------------------------------------- */
function signJWT(user: { id: string; email: string; role: string; name: string }) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL_SECONDS }
  );
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : undefined;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/* -----------------------------------------------------------------------------
   Routes
----------------------------------------------------------------------------- */

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = (req.body || {}) as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await queryOne<User>(
    "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
    [email]
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  if (!user.active) {
    return res.status(403).json({ error: "User is disabled" });
  }

  const token = signJWT({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  return res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role, name: user.name },
  });
});

// POST /api/auth/logout
router.post("/logout", (_req, res) => res.json({ ok: true }));

// GET /api/auth/me
router.get("/me", authRequired, (req: Request, res: Response) => {
  const u = (req as any).user as {
    sub: string;
    email: string;
    role: Role;
    name: string;
  };
  res.json({ id: u.sub, email: u.email, role: u.role, name: u.name });
});

/* -----------------------------------------------------------------------------
   (Optional) Admin endpoints to see/maintain users
   NOTE: Keep them protected in real deployments.
----------------------------------------------------------------------------- */

// GET /api/auth/master/users
router.get("/master/users", async (_req, res) => {
  const users = await query<User>("SELECT id, email, role, name, active, created_at, updated_at FROM users");
  res.json(users);
});

// POST /api/auth/master/users -> upsert (simple)
router.post("/master/users", async (req, res) => {
  const body = req.body as Partial<User & { password: string }>;
  if (!body.email || !body.password || !body.role || !body.name) {
    return res.status(400).json({ error: "email, password, role, name required" });
  }

  const hashedPassword = await bcrypt.hash(body.password, 10);
  const existing = await queryOne<User>(
    "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
    [body.email]
  );

  if (existing) {
    // Update existing user
    await query(
      `UPDATE users 
       SET password_hash = $1, role = $2, name = $3, active = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [hashedPassword, body.role, body.name, body.active ?? true, existing.id]
    );
    const updated = await queryOne<User>(
      "SELECT id, email, role, name, active, created_at, updated_at FROM users WHERE id = $1",
      [existing.id]
    );
    res.json(updated);
  } else {
    // Create new user
    const result = await queryOne<User>(
      `INSERT INTO users (email, password_hash, role, name, active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, role, name, active, created_at, updated_at`,
      [body.email, hashedPassword, body.role, body.name, body.active ?? true]
    );
    res.json(result);
  }
});

export default router;
