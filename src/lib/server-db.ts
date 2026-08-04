import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface DBUser {
  id: string;
  user_id: number;
  email: string;
  name: string;
  display_name: string;
  username: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const JWT_SECRET = process.env.JWT_SECRET || "meet5-super-secret-jwt-key-2026";

function ensureDbExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    // Seed with appi20209@gmail.com and example@gmail.com
    const initialUsers: DBUser[] = [
      createDbUserRecord("appi20209@gmail.com", "123456", "Appi"),
      createDbUserRecord("example@gmail.com", "123456", "Example User"),
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2), "utf-8");
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

function createDbUserRecord(email: string, password: string, name?: string): DBUser {
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);
  const normalizedEmail = email.trim().toLowerCase();
  const emailName = normalizedEmail.split("@")[0];
  const displayName = name || (emailName.charAt(0).toUpperCase() + emailName.slice(1));
  const numericId = Math.floor(100000 + Math.random() * 900000);

  return {
    id: `usr_${Date.now()}_${numericId}`,
    user_id: numericId,
    email: normalizedEmail,
    name: displayName,
    display_name: displayName,
    username: emailName,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  };
}

export function getAllUsers(): DBUser[] {
  ensureDbExists();
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

export function saveAllUsers(users: DBUser[]): void {
  ensureDbExists();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

export function findUserByEmail(email: string): DBUser | undefined {
  const users = getAllUsers();
  const normalized = email.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === normalized);
}

export function findUserById(id: string): DBUser | undefined {
  const users = getAllUsers();
  return users.find((u) => u.id === id || String(u.user_id) === String(id));
}

export function verifyPassword(password: string, user: DBUser): boolean {
  const hash = hashPassword(password, user.salt);
  return hash === user.passwordHash;
}

export function createUser(email: string, password: string, name?: string): DBUser {
  const users = getAllUsers();
  const existing = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    throw new Error("User already exists");
  }

  const newUser = createDbUserRecord(email, password, name);
  users.push(newUser);
  saveAllUsers(users);
  return newUser;
}

// Simple Base64-URL JWT Signer & Verifier using HMAC-SHA256
export function generateJwtToken(user: DBUser): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    })
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

export function verifyJwtToken(token: string): { sub: string; email: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;

    const expectedSig = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest("base64url");

    if (signature !== expectedSig) return null;

    const decodedPayload = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null; // expired
    }
    return decodedPayload;
  } catch (err) {
    return null;
  }
}
