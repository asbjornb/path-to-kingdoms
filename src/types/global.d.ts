import { TierType, BuyAmount } from './game';

declare global {
  interface Window {
    buyBuilding: (settlementId: string, buildingId: string) => void;
    selectTier: (tierType: TierType) => void;
    purchaseResearch: (researchId: string) => void;
    toggleDevMode: () => void;
    toggleShowCompletedResearch: () => void;
    setBuyAmount: (amount: BuyAmount) => void;
    saveGame: () => void;
    deleteSave: () => void;
    exportSave: () => void;
    importSave: (event: Event) => void;
    performPrestige: () => void;
    closePrestigeShop: () => void;
    togglePrestigeShopUpgrade: (upgradeId: string) => void;
    confirmPrestige: () => void;
    purchasePrestigeUpgrade: (upgradeId: string) => void;
    toggleAchievements: () => void;
    toggleCompactView: () => void;
    toggleGoalNotification: (tier: TierType) => void;
    dismissNotification: (id: string) => void;
  }
}

export {};
