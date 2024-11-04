"use client";

import { useState } from "react";
import Text from "../../components/Text";
import SquareButton from "../../components/SquareButton";
import Image from "next/image";
import Spacer from "@/components/Spacer";
import ModifyButton from "@/components/ModifyButton";
import StickyButton from "@/components/StickyButton";
import { useRouter } from "next/navigation";

export default function UploadReceiptPage() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl); // Set the uploaded image URL
      setUploadedFile(file); // Set the uploaded file
    }
  };

  const openCamera = () => {
    document.getElementById("cameraInput")?.click();
  };

  const openFileInput = () => {
    document.getElementById("fileInput")?.click();
  };

  const getPresignedUrl = async () => {
    console.log(apiUrl);
    const response = await fetch(`${apiUrl}/upload`, {
      method: "GET",
    });
    const data = await response.json();
    console.log(data);
    return data.presigned_url;
  };

  const handleSplitReceipt = async () => {
    if (!uploadedFile) {
      console.error("No file to upload");
      return;
    }

    const presignedUrl = await getPresignedUrl();
    const { url, fields } = presignedUrl;
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append("file", uploadedFile);

    // Upload the actual file to S3
    const uploadResponse = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      console.log("File upload failure");
    } else {
      const key = fields.key;
      fetch(`${apiUrl}/ocr`, {
        method: "POST",
        body: JSON.stringify({ key }),
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          router.push(`/${key}/editreceipt`);
        });
    }
  };

  return uploadedImage ? (
    <div className="flex flex-col items-center justify-start px-5">
      <Spacer size="large" />
      <Image src="/logo.png" alt="Logo" width={250} height={100} />
      <Spacer size="medium" />
      <ModifyButton
        icon="fa-sync-alt"
        label="Re-upload"
        onClick={() => {
          setUploadedImage(null);
        }}
      />
      <Spacer size="medium" />
      <img
        src={uploadedImage}
        alt="Uploaded Receipt"
        className="w-full border border-lightgray rounded-lg"
      />
      <StickyButton
        label="Split Receipt"
        onClick={() => {
          handleSplitReceipt();
        }}
        sticky
      />
    </div>
  ) : (
    <div className="flex flex-col items-center justify-start px-5">
      <Spacer size="large" />
      <Image src="/logo.png" alt="Logo" width={250} height={100} />
      <Spacer size="large" />
      <Text type="m_heading" className="text-darkest">
        Upload Your Receipt
      </Text>
      <Spacer size="large" />
      <div className="w-full grid grid-cols-2 gap-4">
        <SquareButton
          label="Take a Photo"
          color="accent"
          icon="fa-camera"
          onClick={openCamera}
        />
        <SquareButton
          label="Photo Library"
          color="primary"
          icon="fa-images"
          onClick={openFileInput}
        />
      </div>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        id="cameraInput"
        className="hidden"
        onChange={handleFileUpload}
      />
      <input
        type="file"
        accept="image/*"
        id="fileInput"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
}
