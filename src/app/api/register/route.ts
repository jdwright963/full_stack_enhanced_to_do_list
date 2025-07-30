// src/app/api/register/route.ts

import { db } from "~/server/db";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "~/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password || typeof password !== 'string' || password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Invalid input. Password must be at least 6 characters." }),
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "Email already in use" }),
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // --- START OF CORRECTED LOGIC ---

    // 1. Generate a verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // 2. Create the new user AND include the verification token
    const newUser = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: email.split('@')[0],
        verificationToken: verificationToken, // Store the token on the user record
      },
    });

    // 3. Send the verification email using the token
    await sendVerificationEmail(newUser.email!, verificationToken);

    // --- END OF CORRECTED LOGIC ---

    return new Response(
      JSON.stringify({ message: "Registration successful! Please check your email to verify your account." }),
      { status: 201 }
    );

  } catch (error) {
    console.error("REGISTRATION_ERROR", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500 }
    );
  }
}