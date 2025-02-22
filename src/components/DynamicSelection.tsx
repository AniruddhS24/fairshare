import React, { useState, useEffect } from "react";
import {
  Item,
  User,
  Split,
  deleteSplit,
  getNewSplitID,
  createSplit,
} from "@/lib/backend";
import LineItem from "@/components/LineItem";
import { useGlobalContext } from "@/contexts/GlobalContext";
interface DynamicSelectionProps {
  receipt_id: string;
  items: { [key: string]: Item };
  users: { [key: string]: User };
  splits: { [key: string]: Split };
  setSplits: React.Dispatch<React.SetStateAction<{ [key: string]: Split }>>;
  disabled: boolean;
}

const DynamicSelection: React.FC<DynamicSelectionProps> = ({
  receipt_id,
  items,
  users,
  splits,
  setSplits,
  disabled,
}) => {
  const { user } = useGlobalContext();
  const [groupedSplits, setGroupedSplits] = useState<{
    [key: string]: Split[];
  }>({});

  useEffect(() => {
    const grouped: { [key: string]: Split[] } = {};
    Object.values(splits).forEach((split) => {
      const { item_id, split_id } = split;
      const groupKey = `${item_id}_${split_id}`;
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(split);
    });

    setGroupedSplits(grouped);
  }, [splits]);

  const handleBubbleClick = async (itemId: string, splitId: string | null) => {
    const user_id = user?.id;
    try {
      const currentSplitKey = `${itemId}_${splitId}_${user_id}`;
      console.log("split " + currentSplitKey);
      if (splits[currentSplitKey]) {
        console.log("split exists");
        deleteSplit(receipt_id, currentSplitKey);
        setSplits((prevSplits) => {
          const updatedSplits = { ...prevSplits };
          delete updatedSplits[currentSplitKey];
          return updatedSplits;
        });
      } else {
        if (splitId == null) {
          const newId = await getNewSplitID(receipt_id, itemId); // Get a new split ID
          splitId = newId.toString();
          console.log("Got new split " + splitId + "for item " + itemId);
          // splitId = (
          //   Object.entries(groupedSplits).filter(([key]) =>
          //     key.startsWith(itemId)
          //   ).length + 1
          // ).toString();
        }
        console.log("split exists");
        setSplits((prevSplits) => {
          const updatedSplits = { ...prevSplits };
          updatedSplits[`${itemId}_${splitId}_${user_id}`] = {
            id: `${itemId}_${splitId}_${user_id}`,
            receipt_id: receipt_id,
            user_id: user_id || "",
            item_id: itemId,
            split_id: splitId || "",
          };
          return updatedSplits;
        });

        createSplit(receipt_id, itemId, splitId);
      }
    } catch (error) {
      console.error("Error updating split:", error);
    }
  };

  return (
    <div className="flex justify-between items-center w-full flex-col">
      {Object.values(items).map((item, index) => {
        const existingSplitsForItem = Object.entries(groupedSplits)
          .filter(([key]) => key.startsWith(item.id)) // Filter for item_id
          .sort(([keyA], [keyB]) => {
            const splitIdA = parseInt(keyA.split("_")[1]);
            const splitIdB = parseInt(keyB.split("_")[1]);
            return splitIdA - splitIdB; // Sort by split_id
          });

        const numExistingSplits = existingSplitsForItem.length;
        const numRemainingBubbles = parseInt(item.quantity) - numExistingSplits;

        return (
          <div key={index} className="w-full mb-4">
            <LineItem
              label={item.quantity + " " + item.name}
              price={parseFloat(item.price)}
              labelColor="text-darkest"
              bold
            />
            <div className="flex flex-wrap mt-2 gap-2">
              {existingSplitsForItem.map(([key, splitGroup]) => {
                const isFilled = splitGroup.length > 0;
                const containsMe =
                  isFilled &&
                  splitGroup.some((split) => split.user_id === user?.id);
                const userNames = isFilled
                  ? splitGroup
                      .map((split) => users[split.user_id]?.name || "Unknown")
                      .join(", ")
                  : "";
                return (
                  <button
                    key={key}
                    className={`flex items-center justify-center ${
                      isFilled
                        ? `w-auto px-4 h-10 rounded-lg border ${
                            containsMe
                              ? "border-primary text-primary font-bold"
                              : "border-lightgray text-midgray"
                          }`
                        : "w-10 h-10 rounded-full border border-lightgray bg-lightgraytransparent"
                    }`}
                    onClick={() =>
                      handleBubbleClick(item.id, key.split("_")[1])
                    }
                    disabled={disabled}
                  >
                    {isFilled ? userNames : ""}
                  </button>
                );
              })}
              {Array.from({ length: numRemainingBubbles }, (_, i) => (
                <button
                  key={numExistingSplits + i}
                  className={`w-10 h-10 rounded-full border border-lightgray ${
                    i !== 0 ? "bg-lightgraytransparent" : ""
                  }`}
                  onClick={() => handleBubbleClick(item.id, null)}
                  disabled={disabled || i !== 0}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DynamicSelection;
