"use client";

import Text from "../../components/Text";
import Image from "next/image";
import Spacer from "@/components/Spacer";
import StickyButton from "@/components/StickyButton";
import Container from "@/components/Container";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const { logout } = useGlobalContext();
  const router = useRouter();

  return (
    <Container centered>
      <Spacer size="large" />
      <Image src="/logo.png" alt="Logo" width={250} height={100} />
      <Spacer size="large" />
      <Text type="m_heading" className="text-darkest">
        Unauthorized
      </Text>
      <Text type="body" className="text-darkest">
        You are not authorized to view this page.
      </Text>
      <Spacer size="large" />
      <StickyButton
        label="Logout"
        onClick={() => {
          logout();
          router.push("/user");
        }}
      />
    </Container>
  );
}
