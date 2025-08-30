import { TierType } from './game';

declare global {
  interface Window {
    buyBuilding: (settlementId: string, buildingId: string) => void;
    selectTier: (tierType: TierType) => void;
    purchaseResearch: (researchId: string) => void;
    toggleDevMode: () => void;
    toggleShowCompletedResearch: () => void;
  }
}

export {};
