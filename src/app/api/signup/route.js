import {connectDB,User} from "@/models/models";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {

    await connectDB();


    const { name, email, password } = await request.json();


    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }


    const emailRegex = /.+\@.+\..+/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }


    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

 
    if (name.trim().length === 0 || name.length > 100) {
      return NextResponse.json(
        { error: "Name must be between 1 and 100 characters" },
        { status: 400 }
      );
    }


    const existingUser = await User.findOne({ 
      email: email.toLowerCase() 
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create new user (password will be hashed automatically by the schema)
    const newUser = new User({
      fullName: name.trim(),
      email: email.toLowerCase(),
      password: password,
      role: 'user',
      isActive: true
    });


    const savedUser = await newUser.save();

    const userResponse = {
      id: savedUser._id,
      fullName: savedUser.fullName,
      email: savedUser.email,
      role: savedUser.role,
      isActive: savedUser.isActive,
      createdAt: savedUser.createdAt
    };

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        user: userResponse
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Signup error:", error);
    

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { 
          error: "Validation failed",
          details: validationErrors
        },
        { status: 400 }
      );
    }

    // Handle duplicate key error (email already exists)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "An error occurred during signup",
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