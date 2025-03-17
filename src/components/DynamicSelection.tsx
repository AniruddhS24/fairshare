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
  // const [activeMenu, setActiveMenu] = useState<string | null>(null);

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
    // setActiveMenu(null);
  };

  const handleAdjustSplit = async (itemId: string, splitId: string) => {
    if (!user?.id) return;
    if (!itemId) return;
    const currentSplits = splits;
    const user_id = user.id;
    const key = `${itemId}_${splitId}_${user_id}`;

    // console.log(key);
    // console.log(pendingAdds);
    // console.log(pendingDeletions);
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
      {Object.values(items)
        .sort((a, b) => (b.global_split ? 1 : 0) - (a.global_split ? 1 : 0))
        .map((item) => {
          const allSplits: {
            [key: string]: {
              consumers: [string];
              mine: boolean;
              pending: boolean;
            };
          } = {};
          Object.values(splits)
            .filter(
              (split) =>
                split.item_id === item.id && !pendingDeletions[split.id]
            )
            .forEach((split) => {
              allSplits[split.split_id] = allSplits[split.split_id] || {
                pending: false,
                consumers: [],
                mine: false,
              };
              allSplits[split.split_id].consumers.push(
                users[split.user_id]?.name || "Unknown"
              );
              allSplits[split.split_id].mine ||= split.user_id == user?.id;
            });
          // TODO: Pass mergedSplits to splits and remove bottom logic, should work...
          Object.values(pendingAdds)
            .filter(
              (split) =>
                split.item_id === item.id && !pendingDeletions[split.id]
            )
            .forEach((split) => {
              const split_id = split.split_id.replace(/^temp/, "");
              if (!(split_id in allSplits)) {
                allSplits[split.split_id] = allSplits[split.split_id] || {
                  pending: false,
                  consumers: [],
                  mine: false,
                };
              }
              allSplits[split.split_id].consumers.push(
                users[split.user_id]?.name || "Unknown"
              );
              allSplits[split.split_id].mine ||= split.user_id == user?.id;
            });

          // const allSplits = [
          //   ...Object.entries(splits),
          //   ...Object.entries(pendingAdds),
          // ]
          //   .filter(
          //     ([, split]) =>
          //       split.item_id === item.id && !pendingDeletions[split.id]
          //   )
          //   .reduce((acc, [, split]) => {
          //     acc[split.split_id] = acc[split.split_id] || {
          //       consumers: [],
          //       mine: false,
          //     };
          //     acc[split.split_id].consumers.push(
          //       users[split.user_id]?.name || "Unknown"
          //     );
          //     acc[split.split_id].mine =
          //       acc[split.split_id].mine || split.user_id == user?.id;
          //     return acc;
          //   }, {} as Record<string, { consumers: string[]; mine: boolean }>);

          return (
            <div key={item.id} className="w-full mb-4">
              <div className={`flex justify-between items-center w-full`}>
                <div className="flex items-center">
                  <Text type="body_bold" className="text-darkest">
                    {item.quantity}{" "}
                    {item.name.length > 18
                      ? `${item.name.substring(0, 18)}...`
                      : item.name}
                  </Text>
                  {item.global_split ? (
                    <div className="flex ms-1 px-1.5 text-midgray items-center bg-gray-50 rounded-s rounded-e">
                      <i
                        className={`fas fa-circle mr-1`}
                        style={{ fontSize: "8px" }}
                      ></i>
                      <Text type="body_bold">Split Evenly</Text>
                    </div>
                  ) : Object.keys(allSplits).length <
                    parseInt(item.quantity) ? (
                    <div className="flex ms-1 px-1.5 text-error items-center bg-red-50 rounded-s rounded-e">
                      <i
                        className={`fas fa-circle mr-1`}
                        style={{ fontSize: "8px" }}
                      ></i>
                      <Text type="body_bold">
                        {parseInt(item.quantity) -
                          Object.keys(allSplits).length}{" "}
                        left
                      </Text>
                    </div>
                  ) : (
                    <div className="flex ms-1 px-1.5 text-accent font-bold items-center bg-teal-50 rounded-s rounded-e">
                      <i
                        className={`fas fa-circle mr-1`}
                        style={{ fontSize: "8px" }}
                      ></i>
                      <Text type="body_bold">Claimed</Text>
                    </div>
                  )}
                </div>
                <Text type="body" className="text-midgray">
                  ${item.price}
                </Text>
              </div>
              {item.global_split ? null : (
                <div className="flex flex-wrap mt-2 gap-2">
                  {!disabled &&
                  Object.keys(allSplits).length < parseInt(item.quantity) ? (
                    <button
                      className="w-10 h-10 rounded-full bg-white border-2 border-lightestgray flex items-center justify-center font-bold
                 text-primary transition-transform duration-150 active:scale-90 active:bg-lightgray"
                      onClick={() => handleAddSplit(item.id)}
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  ) : null}
                  {Object.entries(allSplits).map(([splitId, userNames]) => (
                    <button
                      key={splitId}
                      className={`w-auto px-2 h-10 rounded-lg border text-primary flex items-center justify-center gap-1 ${
                        !disabled
                          ? "transition-transform duration-150 active:scale-90"
                          : ""
                      } ${
                        userNames.mine
                          ? "font-bold border-primary"
                          : "border-primarylight font-normal"
                      }`}
                      style={{
                        borderWidth: `${userNames.mine ? "2px" : "1.5px"}`,
                      }}
                      disabled={disabled}
                      onClick={() => handleAdjustSplit(item.id, splitId)}
                    >
                      <span>{userNames.consumers.join(" + ")}</span>
                      {!userNames.mine && !disabled && (
                        <span className="border border-lightestgray p-1 rounded-md flex items-center justify-center">
                          <img
                            src="/split_scene_24dp_29567D_FILL0_wght400_GRAD0_opsz24.svg"
                            alt="Split Icon"
                            className="w-4 h-4"
                          />
                        </span>
                      )}
                    </button>
                  ))}
                  {Array.from({
                    length:
                      parseInt(item.quantity) - Object.keys(allSplits).length,
                  }).map((_, i) => (
                    <div
                      key={`placeholder-${i}`}
                      className="w-10 h-10 rounded-full bg-lightestgray flex items-center justify-center border border-dashed"
                    ></div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
};

export default DynamicSelection;
