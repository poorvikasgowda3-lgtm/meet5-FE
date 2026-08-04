import { NextResponse } from "next/server";
import {
  findUserByEmail,
  verifyPassword,
  createUser,
  generateJwtToken,
} from "@/lib/server-db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body || {};

    if (!email || !email.trim()) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ message: "Password is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let dbUser = findUserByEmail(normalizedEmail);

    if (dbUser) {
      // User exists -> verify password
      const isPasswordValid = verifyPassword(password, dbUser);
      if (!isPasswordValid) {
        return NextResponse.json(
          { message: "Invalid email or password" },
          { status: 401 }
        );
      }
    } else {
      // User does NOT exist -> automatically create new account in database
      dbUser = createUser(normalizedEmail, password);
    }

    const token = generateJwtToken(dbUser);

    const userPayload = {
      _id: dbUser.id,
      id: dbUser.id,
      user_id: dbUser.user_id,
      email: dbUser.email,
      name: dbUser.name,
      display_name: dbUser.display_name,
      username: dbUser.username,
    };

    return NextResponse.json(
      {
        message: "Login successful",
        user: userPayload,
        token,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Authentication failed" },
      { status: 500 }
    );
  }
}
