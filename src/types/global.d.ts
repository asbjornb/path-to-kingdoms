import { TierType } from './game';

declare global {
  interface Window {
    spawnSettlement: (tierType: TierType) => void;
    buyBuilding: (settlementId: string, buildingId: string) => void;
    selectTier: (tierType: TierType) => void;
    purchaseResearch: (researchId: string) => void;
  }
}

export {};
