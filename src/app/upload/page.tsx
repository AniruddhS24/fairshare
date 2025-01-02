"use client";

import { useEffect, useState } from "react";
import Text from "../../components/Text";
import LogoutSection from "@/components/LogoutSection";
import SquareButton from "../../components/SquareButton";
import Spacer from "@/components/Spacer";
import ModifyButton from "@/components/ModifyButton";
import StickyButton from "@/components/StickyButton";
import Container from "@/components/Container";
import { useRouter } from "next/navigation";
import {
  useGlobalContext,
  Permission,
  AuthStatus,
} from "@/contexts/GlobalContext";
import { backend, getUploadLink } from "@/lib/backend";

export default function UploadReceiptPage() {
  const { status } = useGlobalContext();
  const router = useRouter();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  useEffect(() => {
    if (status === AuthStatus.CHECKING) {
      return;
    } else if (status === AuthStatus.NO_TOKEN) {
      router.push(`/user?page=upload`);
    } else if (status === AuthStatus.BAD_TOKEN) {
      router.push(`/user`);
    }
  }, [status, router]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
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
    const data = await getUploadLink();
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
      await backend("POST", "/ocr", { key });
      await backend("POST", `/receipt/${key}/role`, {
        role: Permission.HOST,
      });
      router.push(`/${key}/editreceipt`);
    }
  };

  return uploadedImage ? (
    <Container centered>
      <LogoutSection></LogoutSection>
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
      <StickyButton label="Split Receipt" onClick={handleSplitReceipt} sticky />
    </Container>
  ) : (
    <Container centered>
      <LogoutSection></LogoutSection>
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
    </Container>
  );
}
