import { NextResponse } from "next/server";
import { verifyJwtToken, findUserById } from "@/lib/server-db";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "No token provided" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyJwtToken(token);

    if (!decoded || !decoded.sub) {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 });
    }

    const user = findUserById(decoded.sub);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        _id: user.id,
        id: user.id,
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        display_name: user.display_name,
        username: user.username,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ message: "Token verification failed" }, { status: 500 });
  }
}
