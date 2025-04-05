"use client";

import { useEffect, useState } from "react";
import Text from "../../components/Text";
import Image from "next/image";
import Spacer from "@/components/Spacer";
import ModifyButton from "@/components/ModifyButton";
import StickyButton from "@/components/StickyButton";
import Container from "@/components/Container";
import { useRouter } from "next/navigation";
import { useGlobalContext, AuthStatus } from "@/contexts/GlobalContext";
import { backend, getUploadLink } from "@/lib/backend";
import Spinner from "@/components/Spinner";
import OptionButton from "@/components/OptionButton";

export default function UploadReceiptPage() {
  const { status, user, setRole } = useGlobalContext();
  const router = useRouter();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleCreateReceipt = async () => {
    setLoading(true);
    // const receipt = await createEmptyReceipt();
    // setReceipt(receipt);
    // setRole({
    //   receipt_id: receipt.id,
    //   user_id: user?.id || "",
    //   permission: "host",
    //   done: false,
    // });
    router.push(`/new/edit`);
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
      // await backend("POST", `/receipt/${key}/role`, {
      //   role: Permission.HOST,
      // });
      setRole({
        receipt_id: key,
        user_id: user?.id || "",
        permission: "host",
        done: false,
      });
      router.push(`/${key}/edit`);
    }
  };

  return uploadedImage ? (
    <Container centered header>
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
        icon="fa-receipt"
        label="Scan Items"
        onClick={handleSplitReceipt}
        sticky
      />
    </Container>
  ) : (
    <Container centered header>
      <Spacer size="large" />
      <Image src="/applogo.png" alt="Logo" width={200} height={100} />
      <Spacer size="large" />
      <Text type="m_heading" className="text-darkest">
        Upload Receipt
      </Text>
      <Text type="body" className="text-center text-midgray">
        Upload your receipt to create a live link where your friends can add
        their shares!
      </Text>
      <Spacer size="large" />
      {!loading ? (
        <div className="absolute bottom-0 left-0 right-0 px-4 mb-6">
          <OptionButton
            label="Take Photo"
            onClick={openCamera}
            iconSize="fa-xl"
            icon="fa-camera"
            className={`bg-primary py-3 px-6 rounded-full border-2 border-primary text-white transition-colors duration-150 ease-in-out active:bg-primarydark`}
          />
          <Spacer size="medium" />
          <OptionButton
            label="Upload Image"
            onClick={openFileInput}
            iconSize="fa-xl"
            icon="fa-images"
            className={`bg-primary py-3 px-6 rounded-full border-2 border-primary text-white transition-colors duration-150 ease-in-out active:bg-primarydark`}
          />
          <div className="flex items-center justify-center space-x-2 my-4">
            <hr className="flex-1 border-t border-lightgray" />
            <Text type="body_semi" className="text-midgray">
              or
            </Text>
            <hr className="flex-1 border-t border-lightgray" />
          </div>
          {/* <Spacer size="medium" /> */}
          <OptionButton
            label="Enter Manually"
            icon="fa-pen"
            iconSize="fa-xl"
            onClick={handleCreateReceipt}
            className={`bg-white py-3 px-6 rounded-full border-2 border-primarylight text-primary transition-colors duration-150 ease-in-out active:bg-primarylight`}
          />
        </div>
      ) : (
        // <div className="w-full grid grid-cols-2 gap-4 ">
        //   <SquareButton
        //     label="Enter Manually"
        //     color="accent"
        //     icon="fa-pen-to-square"
        //     onClick={handleCreateReceipt}
        //   />
        //   <SquareButton
        //     label="Upload Photo"
        //     color="primary"
        //     icon="fa-camera"
        //     onClick={openFileInput}
        //   />
        // </div>
        <div className="flex w-full items-center justify-center">
          <Spinner color="text-primary" />
        </div>
      )}
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
