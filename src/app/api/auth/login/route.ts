import { NextResponse } from "next/server";
import {
  findUserByEmail,
  verifyPassword,
  createUser,
  generateJwtToken,
} from "@/lib/server-db";

export async function POST(request: Request) {
  const timestamp = new Date().toISOString();
  console.log(`\n==================================================`);
  console.log(`[BACKEND-API ${timestamp}] POST /api/auth/login received`);

  try {
    let body;
    try {
      body = await request.json();
    } catch (parseErr) {
      console.error(`[BACKEND-API] Failed to parse request JSON body:`, parseErr);
      return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
    }

    const { email, password } = body || {};
    console.log(`[BACKEND-API] Request payload -> Email: "${email}", Password length: ${password ? password.length : 0}`);

    if (!email || !email.trim()) {
      console.warn(`[BACKEND-API] Validation error: Email is missing`);
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }
    if (!password) {
      console.warn(`[BACKEND-API] Validation error: Password is missing`);
      return NextResponse.json({ message: "Password is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log(`[BACKEND-API] Querying Database for user email: "${normalizedEmail}"`);
    let dbUser = findUserByEmail(normalizedEmail);

    let isNewUser = false;
    if (dbUser) {
      console.log(`[BACKEND-API] User found in database (ID: ${dbUser.id}). Verifying password...`);
      const isPasswordValid = verifyPassword(password, dbUser);
      if (!isPasswordValid) {
        console.warn(`[BACKEND-API] Password verification failed for user: ${normalizedEmail}`);
        return NextResponse.json(
          { message: "Invalid email or password" },
          { status: 401 }
        );
      }
      console.log(`[BACKEND-API] Password verification SUCCESS for user: ${normalizedEmail}`);
    } else {
      console.log(`[BACKEND-API] User NOT found in database. Automatically creating new user in DB...`);
      dbUser = createUser(normalizedEmail, password);
      isNewUser = true;
      console.log(`[BACKEND-API] DB Insertion Success -> New User ID: ${dbUser.id}, Email: ${dbUser.email}, Name: ${dbUser.name}`);
    }

    console.log(`[BACKEND-API] Generating JWT Token for user ID: ${dbUser.id}...`);
    const token = generateJwtToken(dbUser);
    console.log(`[BACKEND-API] JWT Token generated successfully (Length: ${token.length})`);

    const userPayload = {
      _id: dbUser.id,
      id: dbUser.id,
      user_id: dbUser.user_id,
      email: dbUser.email,
      name: dbUser.name,
      display_name: dbUser.display_name,
      username: dbUser.username,
    };

    console.log(`[BACKEND-API] Returning HTTP 200/201 response to client for user: ${dbUser.email}`);
    console.log(`==================================================\n`);

    return NextResponse.json(
      {
        message: isNewUser ? "Account created and logged in" : "Login successful",
        user: userPayload,
        token,
        databaseStatus: isNewUser ? "Inserted new user into DB" : "Retrieved existing user from DB",
      },
      { status: isNewUser ? 201 : 200 }
    );
  } catch (error: any) {
    console.error(`[BACKEND-API ERROR] Exception in login route:`, error);
    console.log(`==================================================\n`);
    return NextResponse.json(
      { message: error.message || "Server error during authentication" },
      { status: 500 }
    );
  }
}
