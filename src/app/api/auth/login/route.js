import { connectDB,User } from "@/models/models";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {

    await connectDB();


    const { email, password } = await request.json();


    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }


    const user = await User.findOne({ 
      email: email.toLowerCase(), 
      isActive: true 
    }).select('+password');

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }


    const userResponse = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: userResponse
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Login error:", error);
    
    return NextResponse.json(
      { 
        error: "An error occurred during login",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}


export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}