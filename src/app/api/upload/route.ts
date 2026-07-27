import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { UploadApiResponse } from "cloudinary";

export async function POST(request: NextRequest) {
  try {
     console.log("UPLOAD API CALLED");
    const formData = await request.formData();

    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "reviews",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else if (result) {
              resolve(result);
            } else {
              reject(new Error("Upload failed"));
            }
          }
        )
        .end(buffer);
    });
console.log(result.secure_url);
    return NextResponse.json({
      success: true,
      url: result.secure_url,
    });
  } catch (err: any) {
    console.error("Cloudinary Upload Error:", err);

    return NextResponse.json(
      {
        error: err.message || "Upload failed",
      },
      {
        status: 500,
      }
    );
  }
}