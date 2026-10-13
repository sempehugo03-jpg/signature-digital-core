// Compatibility with the existing sd_platform_users / sd_platform_sessions records.
// No admin account, OAuth or Kévin session is involved in the customer journey.
import { digest, fail } from "./contract.mjs";
const enc = (b) =>
  btoa(String.fromCharCode(...b))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
const dec = (s) =>
  Uint8Array.from(
    atob(
      s.replaceAll("-", "+").replaceAll("_", "/") +
        "=".repeat((4 - (s.length % 4)) % 4),
    ),
    (c) => c.charCodeAt(0),
  );
const safeUser = (r) => ({
  id: r.id,
  email: r.email,
  firstName: r.first_name,
  lastName: r.last_name,
  avatarUrl: r.avatar_url || '',
  provider: r.provider || 'password',
});
export function productAuth({ db, clock = () => Date.now(), secure = true }) {
  const iso = () => new Date(clock()).toISOString();
  const first = (sql, ...values) =>
    db
      .prepare(sql)
      .bind(...values)
      .first();
  const run = (sql, ...values) =>
    db
      .prepare(sql)
      .bind(...values)
      .run();
  const tokenHash = async (t) =>
    enc(
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)),
      ),
    );
  const cookie = (token, expires) =>
    `fabrya_session=${token}; Path=/; HttpOnly; SameSite=Lax; Priority=High${secure ? "; Secure" : ""}; ${token ? `Expires=${new Date(expires).toUTCString()}` : "Max-Age=0"}`;
  const readToken = (req) =>
    req.headers
      .get("cookie")
      ?.split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith("fabrya_session="))
      ?.slice(15) || "";
  async function derive(password, salt, iterations = 100000) {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    return new Uint8Array(
      await crypto.subtle.deriveBits(
        { name: "PBKDF2", hash: "SHA-256", salt, iterations },
        key,
        256,
      ),
    );
  }
  async function rate(req, scope, subject, limit = 10) {
    const window = Math.floor(clock() / 600000);
    const ip = req.headers.get("cf-connecting-ip") || "unknown";
    const key = await digest(scope + ":" + subject + ":" + ip + ":" + window);
    await run(
      "INSERT INTO fp_auth_limits(bucket,count,updated_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1,updated_at=excluded.updated_at",
      key,
      iso(),
    );
    const r = await first(
      "SELECT count FROM fp_auth_limits WHERE bucket=?",
      key,
    );
    if (r.count > limit)
      fail(
        "RATE_LIMIT",
        "Trop de tentatives. Réessayez dans dix minutes.",
        429,
      );
    await run(
      "DELETE FROM fp_auth_limits WHERE updated_at<?",
      new Date(clock() - 3600000).toISOString(),
    );
  }
  async function session(user,ttl=30*86400000) {
    await run("DELETE FROM sd_platform_sessions WHERE expires_at<=?", iso());
    const token = "fby_" + enc(crypto.getRandomValues(new Uint8Array(32)));
    const expires = clock() + ttl;
    await run(
      "INSERT INTO sd_platform_sessions(id,user_id,token_hash,expires_at,created_at,last_seen_at) VALUES(?,?,?,?,?,?)",
      crypto.randomUUID(),
      user.id,
      await tokenHash(token),
      new Date(expires).toISOString(),
      iso(),
      iso(),
    );
    return { user: safeUser(user), cookie: cookie(token, expires) };
  }
  async function register(req, body) {
    const email = String(body.email || "")
        .trim()
        .toLowerCase()
        .slice(0, 180),
      name = String(body.name || "")
        .trim()
        .slice(0, 80),
      password = String(body.password || "");
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !name ||
      password.length < 10 ||
      password.length > 128
    )
      fail(
        "INVALID_ACCOUNT",
        "Indiquez votre prénom, votre email et un mot de passe de 10 caractères minimum.",
      );
    await rate(req, "register", email, 5);
    const salt = crypto.getRandomValues(new Uint8Array(16)),
      hash = "pbkdf2$100000$" + enc(await derive(password, salt));
    const u = {
      id: crypto.randomUUID(),
      email,
      first_name: name,
      last_name: "",
    };
    const r = await run(
      `INSERT OR IGNORE INTO sd_platform_users(id,email,first_name,last_name,avatar_url,provider,provider_subject,password_hash,password_salt,status,created_at,updated_at) VALUES(?,?,?,'','','password','',?,?,'active',?,?)`,
      u.id,
      email,
      name,
      hash,
      enc(salt),
      iso(),
      iso(),
    );
    if (!r.meta?.changes)
      fail(
        "ACCOUNT_EXISTS",
        "Un compte existe déjà avec cette adresse. Connectez-vous.",
        409,
      );
    return session(u);
  }
  async function login(req, body) {
    const email = String(body.email || "")
        .trim()
        .toLowerCase()
        .slice(0, 180),
      password = String(body.password || "").slice(0, 128);
    await rate(req, "login", email);
    const u = await first(
      "SELECT * FROM sd_platform_users WHERE email=? AND status='active'",
      email,
    );
    const match = u?.password_hash?.match(/^pbkdf2\$(\d+)\$(.+)$/);
    const iterations = match ? Number(match[1]) : 210000;
    const salt = u?.password_salt ? dec(u.password_salt) : new Uint8Array(16);
    const actual = await derive(
      password,
      salt,
      Math.max(50000, Math.min(iterations, 1000000)),
    );
    const expected = u?.password_hash
      ? dec(match ? match[2] : u.password_hash)
      : new Uint8Array(32);
    let different = actual.length ^ expected.length;
    for (let i = 0; i < actual.length; i++)
      different |= actual[i] ^ (expected[i] || 0);
    if (!u || different)
      fail("LOGIN_FAILED", "Email ou mot de passe incorrect.", 401);
    return session(u);
  }
  async function user(req) {
    const token = readToken(req);
    if (!token) return null;
    const r = await first(
      `SELECT u.*,s.id AS session_id FROM sd_platform_sessions s JOIN sd_platform_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND s.last_seen_at>? AND u.status='active'`,
      await tokenHash(token),
      iso(),
      new Date(clock() - 14 * 86400000).toISOString(),
    );
    if (!r) return null;
    await run(
      "UPDATE sd_platform_sessions SET last_seen_at=? WHERE id=?",
      iso(),
      r.session_id,
    );
    return safeUser(r);
  }
  async function logout(req) {
    const token = readToken(req);
    if (token)
      await run(
        "DELETE FROM sd_platform_sessions WHERE token_hash=?",
        await tokenHash(token),
      );
    return { cookie: cookie("", 0) };
  }
  return { user, register, login, logout, rate };
}
