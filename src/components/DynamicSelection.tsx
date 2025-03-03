import React from "react";
import { Item, User, Split } from "@/lib/backend";
import Text from "@/components/Text";
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
  pendingDeletions: { [key: string]: boolean };
  setPendingDeletions: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
  disabled: boolean;
  onSplitChange?: () => void;
}

const DynamicSelection: React.FC<DynamicSelectionProps> = ({
  receipt_id,
  items,
  users,
  splits,
  pendingAdds,
  setPendingAdditions,
  pendingDeletions,
  setPendingDeletions,
  disabled,
  onSplitChange,
}) => {
  const { user } = useGlobalContext();

  function generateHexUUID16() {
    const now = Date.now().toString(16); // Timestamp in hex
    const randomPart = Math.random().toString(16).slice(2, 10); // 8 random hex digits
    return (now + randomPart).slice(-16).toUpperCase(); // Ensure exactly 16 characters
  }

  const handleAddSplit = async (itemId: string) => {
    if (!user?.id) return;
    const user_id = user.id;
    const tempSplitId = `temp${generateHexUUID16()}`;
    const key = `${itemId}_${tempSplitId}_${user_id}`;

    setPendingAdditions((prev) => ({
      ...prev,
      [key]: {
        id: key,
        receipt_id,
        user_id,
        item_id: itemId,
        split_id: tempSplitId,
      },
    }));

    onSplitChange?.();
  };

  const handleAdjustSplit = async (itemId: string, splitId: string) => {
    if (!user?.id) return;
    if (!itemId) return;
    const currentSplits = splits;
    const user_id = user.id;
    const key = `${itemId}_${splitId}_${user_id}`;

    if (key in pendingAdds) {
      setPendingAdditions((prev) => {
        const updated = { ...prev };
        if (key in updated) delete updated[key];
        return updated;
      });
    } else if (key in pendingDeletions) {
      setPendingDeletions((prev) => {
        const updated = { ...prev };
        if (key in updated) delete updated[key];
        return updated;
      });
    } else if (key in currentSplits) {
      setPendingDeletions((prev) => {
        const updated = { ...prev };
        updated[key] = true;
        return updated;
      });
    } else {
      setPendingAdditions((prev) => {
        const updated = { ...prev };
        updated[key] = {
          id: key,
          receipt_id,
          user_id,
          item_id: itemId,
          split_id: splitId,
        };
        return updated;
      });
    }

    onSplitChange?.();
  };

  return (
    <div className="flex flex-col w-full">
      {Object.values(items).map((item) => {
        const allSplits = [
          ...Object.entries(splits),
          ...Object.entries(pendingAdds),
        ]
          .filter(
            ([, split]) =>
              split.item_id === item.id && !pendingDeletions[split.id]
          )
          .reduce((acc, [, split]) => {
            acc[split.split_id] = acc[split.split_id] || {
              consumers: [],
              mine: false,
            };
            acc[split.split_id].consumers.push(
              users[split.user_id]?.name || "Unknown"
            );
            acc[split.split_id].mine =
              acc[split.split_id].mine || split.user_id == user?.id;
            return acc;
          }, {} as Record<string, { consumers: string[]; mine: boolean }>);

        return (
          <div key={item.id} className="w-full mb-4">
            {/* <LineItem
              label={`${item.quantity} ${item.name}`}
              price={parseFloat(item.price) * parseInt(item.quantity)}
              labelColor="text-darkest"
              bold
            /> */}
            <div className={`flex justify-between items-center w-full`}>
              <div className="flex items-center">
                <Text type="body_bold" className="text-darkest">
                  {item.quantity} {item.name}
                </Text>
                {Object.keys(allSplits).length < parseInt(item.quantity) ? (
                  <div className="flex ms-1 px-1 text-error font-bold items-center">
                    <i
                      className={`fas fa-circle mr-1`}
                      style={{ fontSize: "8px" }}
                    ></i>
                    <Text type="body_bold">
                      {parseInt(item.quantity) - Object.keys(allSplits).length}{" "}
                      Unclaimed
                    </Text>
                  </div>
                ) : (
                  <div className="flex ms-1 px-1 text-primary font-bold items-center">
                    <i
                      className={`fas fa-circle mr-1`}
                      style={{ fontSize: "8px" }}
                    ></i>
                    <Text type="body_bold">Claimed</Text>
                  </div>
                )}
              </div>
              <Text type="body" className="text-midgray">
                ${(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}
              </Text>
            </div>
            <div className="flex flex-wrap mt-2 gap-2">
              {!disabled &&
              Object.keys(allSplits).length < parseInt(item.quantity) ? (
                <button
                  className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold 
             text-white transition-transform duration-150 active:scale-90"
                  onClick={() => handleAddSplit(item.id)}
                >
                  <i className="fas fa-plus"></i>
                </button>
              ) : null}
              {Object.entries(allSplits).map(([splitId, userNames]) => (
                <button
                  key={splitId}
                  className={`w-auto px-4 h-10 rounded-lg border border-primary text-primary ${
                    userNames.mine
                      ? "font-bold bg-[#087a8733] border-2"
                      : "font-normal"
                  }`}
                  disabled={disabled}
                  onClick={() => handleAdjustSplit(item.id, splitId)}
                >
                  {userNames.consumers.join(", ")}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DynamicSelection;
