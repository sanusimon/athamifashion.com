import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET!;

    const uploadForm = new FormData();

  uploadForm.append(
  "file",
  new Blob([arrayBuffer], { type: file.type }),
  file.name
);

    uploadForm.append("upload_preset", uploadPreset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: uploadForm,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: data.secure_url,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error: "Upload failed",
      },
      { status: 500 }
    );
  }
}