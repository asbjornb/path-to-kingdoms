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
  }
}

export {};
