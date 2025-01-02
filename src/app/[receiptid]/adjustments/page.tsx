"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

import Spacer from "@/components/Spacer";
import LogoutSection from "@/components/LogoutSection";
import Text from "../../../components/Text";
import QuantityInput from "@/components/QuantityInput";
import ModifyButton from "@/components/ModifyButton";
import StickyButton from "@/components/StickyButton";
import Container from "@/components/Container";
import Spinner from "@/components/Spinner";
import {
  useGlobalContext,
  Permission,
  AuthStatus,
} from "@/contexts/GlobalContext";
import {
  getReceipt,
  getItems,
  getMySplits,
  createSplit,
  deleteSplit,
} from "@/lib/backend";

type AccordionItemProps = {
  item: {
    id: string;
    name: string;
    quantity: string;
    price: string;
    split: string;
  };
  setQuantity: (value: number) => void;
  setSplit: (value: number) => void;
};

const AccordionItem: React.FC<AccordionItemProps> = ({
  item,
  setQuantity,
  setSplit,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`col-span-8 grid grid-cols-8 items-center pb-3`}>
      <div
        className={`col-span-8 rounded-xl bg-[#C1C9D026] ${
          isOpen ? "pb-2" : ""
        }`}
      >
        <div className="flex justify-start items-center py-5 px-4 shadow-custom-light rounded-xl bg-white">
          <div className="flex justify-between items-center w-full">
            <Text type="body_semi" className="text-darkest">
              {item.name}
            </Text>
            <ModifyButton
              label="Edit"
              icon="fa-pen"
              onClick={() => toggleAccordion()}
            />
          </div>
        </div>
        <div
          className={`flex w-full px-4 transition-all duration-200 ease-in-out ${
            isOpen
              ? "max-h-96 opacity-100 pt-2"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
          style={{ visibility: isOpen ? "visible" : "hidden" }}
        >
          <div className="grid grid-cols-8 gap-y-3">
            <div className="col-span-8 grid grid-cols-8 items-center">
              <div className="col-span-6 pr-2">
                <Text type="body" className="text-darkest">
                  How many{" "}
                  <Text type="body_bold" className="text-darkest">
                    units
                  </Text>{" "}
                  of this item did you/your group consume?
                </Text>
              </div>
              <div className="col-span-2">
                <QuantityInput
                  value={parseInt(item.quantity)}
                  setValue={setQuantity}
                />
              </div>
            </div>
            <div className="col-span-8 grid grid-cols-8 items-center">
              <div className="col-span-6 pr-2">
                <Text type="body" className="text-darkest">
                  Only if you{" "}
                  <Text type="body_bold" className="text-darkest">
                    shared
                  </Text>{" "}
                  this item, how many people are in your group?
                </Text>
              </div>
              <div className="col-span-2">
                <QuantityInput
                  value={parseInt(item.split)}
                  setValue={setSplit}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AdjustmentReceiptItem {
  id: string;
  name: string;
  quantity: string;
  price: string;
  split: string;
}

export default function AdjustmentsPage({
  params,
}: {
  params: { receiptid: string };
}) {
  const { status, getPermission } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  const [receiptItems, setReceiptItems] = useState<AdjustmentReceiptItem[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const receipt_id = params.receiptid;

  useEffect(() => {
    setLoading(true);

    if (status === AuthStatus.CHECKING) {
      return;
    } else if (status === AuthStatus.NO_TOKEN) {
      router.push(`/user?receiptid=${receipt_id}&page=adjustments`);
    } else if (status === AuthStatus.BAD_TOKEN) {
      router.push(`/user`);
    } else if (status === AuthStatus.AUTHORIZED) {
      getPermission(receipt_id).then((permission) => {
        if (permission === Permission.UNAUTHORIZED) {
          router.push(`/unauthorized`);
        }
      });
    }

    const fetchData = async () => {
      let items = [];
      const receipt = await getReceipt(receipt_id);
      if (receipt.settled) {
        router.push(`/${receipt_id}/dashboard`);
      }
      const receipt_items = await getItems(receipt_id);
      for (const item of receipt_items) {
        items.push({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          split: "0",
        });
      }
      const selected = searchParams.get("selected");
      if (selected) {
        const onlyInclude = (selected as string).split(",").map(Number);
        items = items.filter((_, index) => onlyInclude.includes(index));
      }
      setReceiptItems(items);
    };

    fetchData().then(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, receipt_id, searchParams]);

  const setItemProp =
    (index: number, field: keyof AdjustmentReceiptItem) =>
    (value: string | number) => {
      const newReceiptItems = [...receiptItems];
      newReceiptItems[index][field] = value.toString();
      setReceiptItems(newReceiptItems);
    };

  const handleSaveSelections = async () => {
    const promises = [];

    const currentSplits = await getMySplits(receipt_id);
    for (const split of currentSplits) {
      promises.push(deleteSplit(receipt_id, split.id));
    }

    for (const item of receiptItems) {
      promises.push(
        createSplit(receipt_id, item.quantity, item.split, item.id)
      );
    }

    const permission = await getPermission(receipt_id);
    await Promise.all(promises);
    if (permission === Permission.HOST) {
      router.push(`/${receipt_id}/share`);
    } else if (permission === Permission.CONSUMER) {
      router.push(`/${receipt_id}/done`);
    } else {
      router.push(`/unauthorized`);
    }
  };

  return (
    <Container>
      <LogoutSection></LogoutSection>
      <div className="flex items-center w-full">
        <Text type="xl_heading" className="text-darkest">
          Adjustments
        </Text>
        <span className="ml-2 px-2 py-1 font-bold text-sm text-primary bg-accentlight rounded-md">
          optional
        </span>
      </div>
      <Spacer size="small" />
      <Text type="body" className="text-midgray">
        <Text type="body_bold" className="text-darkest">
          By default each item will be split evenly across all consumers.
        </Text>{" "}
        However, ONLY if you consumed an uneven portion of any item, adjust that
        here.
        <Text type="body_bold" className="text-darkest">
          {" "}
          If not, please SKIP this step.
        </Text>
      </Text>
      <Spacer size="large" />
      {!loading ? (
        <div className="w-full">
          <div className="grid grid-cols-8 w-full">
            {receiptItems.map((item, index) => (
              <AccordionItem
                key={index}
                item={item}
                setQuantity={setItemProp(index, "quantity")}
                setSplit={setItemProp(index, "split")}
              />
            ))}
          </div>
          <Spacer size="medium" />
          <StickyButton label="Next" onClick={handleSaveSelections} sticky />
        </div>
      ) : (
        <div className="flex w-full items-center justify-center">
          <Spinner color="text-primary" />
        </div>
      )}
    </Container>
  );
}
