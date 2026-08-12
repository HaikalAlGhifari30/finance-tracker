import React from "react";
import {
  GoldCoinIcon,
  GoldBraceletIcon,
  GoldRingIcon,
  GoldNecklaceIcon,
  GoldEarringIcon,
} from "@/components/icons/GoldAssetIcons";

export function getGoldAssetIcon(
  asset?: { type?: string; jewelryType?: string; productName?: string } | null,
  className = "w-6 h-6"
) {
  if (!asset) return <GoldCoinIcon className={className} />;

  if (asset.type === "LOGAM_MULIA") {
    return <GoldCoinIcon className={className} />;
  }

  const text = `${asset.jewelryType || ""} ${asset.productName || ""}`.toLowerCase();

  if (text.includes("gelang") || text.includes("bracelet") || text.includes("bangle")) {
    return <GoldBraceletIcon className={className} />;
  }
  if (text.includes("kalung") || text.includes("necklace") || text.includes("liontin") || text.includes("pendant")) {
    return <GoldNecklaceIcon className={className} />;
  }
  if (text.includes("anting") || text.includes("earring") || text.includes("giok") || text.includes("subang")) {
    return <GoldEarringIcon className={className} />;
  }
  if (text.includes("cincin") || text.includes("ring")) {
    return <GoldRingIcon className={className} />;
  }

  return <GoldRingIcon className={className} />;
}
