import { NextResponse } from "next/server";
import {
  findUserByEmail,
  createUser,
  generateJwtToken,
} from "@/lib/server-db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body || {};

    if (!email || !email.trim()) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ message: "Password is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let dbUser = findUserByEmail(normalizedEmail);

    if (dbUser) {
      return NextResponse.json(
        { message: "User already exists with this email" },
        { status: 400 }
      );
    }

    dbUser = createUser(normalizedEmail, password, name);
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
        message: "Registration successful",
        user: userPayload,
        token,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Registration failed" },
      { status: 500 }
    );
  }
}
