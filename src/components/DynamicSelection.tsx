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
  pendingAdds: { [key: string]: Split };
  setPendingAdditions: React.Dispatch<
    React.SetStateAction<{ [key: string]: Split }>
  >;
  pendingDeletes: { [key: string]: boolean };
  setPendingDeletions: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
  disabled: boolean;
  unclaimedItems: boolean;
  setUnclaimedItems: React.Dispatch<React.SetStateAction<boolean>>;
  setVisibleSplits: React.Dispatch<React.SetStateAction<Split[]>>;
  realToTemp: {
    [key: string]: string;
  };
  setRealToTemp: React.Dispatch<
    React.SetStateAction<{
      [key: string]: string;
    }>
  >;
}

const DynamicSelection: React.FC<DynamicSelectionProps> = ({
  receipt_id,
  items,
  users,
  splits,
  pendingAdds,
  setPendingAdditions,
  pendingDeletes,
  setPendingDeletions,
  disabled,
  unclaimedItems,
  setUnclaimedItems,
  setVisibleSplits,
  realToTemp,
  setRealToTemp,
}) => {
  const { user } = useGlobalContext();
  const [groupedSplits, setGroupedSplits] = useState<{
    [key: string]: Split[];
  }>({});

  useEffect(() => {
    const grouped: { [key: string]: Split[] } = {};
    const allSplits = [
      ...Object.values(splits).filter(
        ({ id }) =>
          !pendingDeletes[id] ||
          (id in realToTemp && !pendingDeletes[realToTemp[id]])
      ),
      ...Object.values(pendingAdds).filter(({ id }) => !pendingDeletes[id]),
    ];
    setVisibleSplits(allSplits);

    // for (const real_id in realToTemp) {
    //   if (realToTemp[real_id] in pendingDeletes) {
    //     deleteSplit(receipt_id, real_id);
    //   }
    // }

    allSplits.forEach((split) => {
      const { item_id, split_id } = split;
      const groupKey = `${item_id}_${split_id}`;
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(split);
    });

    setGroupedSplits(grouped);
  }, [splits, pendingAdds, pendingDeletes]);

  const handleBubbleClick = async (itemId: string, splitId: string | null) => {
    if (!user?.id) return;
    setUnclaimedItems(false);
    const user_id = user.id;
    const key = `${itemId}_${splitId}_${user_id}`;
    const tempSplitId = `temp${Date.now()}`;
    console.log(`key: ${key}`);
    if (splitId?.startsWith("temp")) {
      // If you click and immediately unclick (split has temporary ID, hasn;t had time to get the real one yet)
      console.log("temporary logic");
      setPendingDeletions((prev) => {
        const updated = { ...prev };
        updated[key] = true;
        return updated;
      });
      return;
    }
    // Frontend state update
    if (key in splits) {
      setPendingDeletions((prev) => {
        const updated = { ...prev };
        updated[key] = true;
        return updated;
      });
      await deleteSplit(receipt_id, key);
    } else {
      setPendingDeletions((prev) => {
        const updated = { ...prev };
        if (splitId && key in updated) {
          delete updated[key];
        }
        return updated;
      });
      setPendingAdditions((prev) => {
        const updated = { ...prev };
        if (splitId != null) {
          updated[key] = {
            id: splitId,
            receipt_id,
            user_id,
            item_id: itemId,
            split_id: splitId,
          };
        } else {
          updated[`${itemId}_${tempSplitId}_${user_id}`] = {
            id: `${itemId}_${tempSplitId}_${user_id}`,
            receipt_id,
            user_id,
            item_id: itemId,
            split_id: tempSplitId,
          };
        }
        return updated;
      });

      if (splitId) {
        await createSplit(receipt_id, itemId, splitId);
      } else {
        const newId = (await getNewSplitID(receipt_id, itemId)).toString();
        const realKey = `${itemId}_${newId}_${user_id}`;

        setRealToTemp((prev) => {
          const updated = { ...prev };
          updated[realKey] = `${itemId}_${tempSplitId}_${user_id}`;
          return updated;
        });
        await createSplit(receipt_id, itemId, newId);
        console.log(`Scheduled deletion of ${tempSplitId} --> ${realKey}`);
      }
    }
  };

  return (
    <div className="flex justify-between items-center w-full flex-col">
      {Object.values(items).map((item, index) => {
        const existingSplitsForItem = Object.entries(groupedSplits)
          .filter(([key]) => key.startsWith(item.id))
          .sort(([keyA], [keyB]) => {
            const splitIdA = parseInt(keyA.split("_")[1]);
            const splitIdB = parseInt(keyB.split("_")[1]);
            return splitIdA - splitIdB;
          });

        const numExistingSplits = existingSplitsForItem.length;
        const numRemainingBubbles = parseInt(item.quantity) - numExistingSplits;

        return (
          <div key={index} className="w-full mb-4">
            <LineItem
              label={item.quantity + " " + item.name}
              price={parseFloat(item.price) * parseInt(item.quantity)}
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
                      .sort((a, b) => a.localeCompare(b))
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
                  className={`w-10 h-10 rounded-full border-2 ${
                    unclaimedItems ? "border-red-700" : "border-lightgray"
                  } ${
                    unclaimedItems
                      ? i !== 0
                        ? "border-dotted bg-red-200"
                        : "bg-red-200"
                      : i !== 0
                      ? "border-dotted bg-lightgraytransparent"
                      : "bg-white"
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
