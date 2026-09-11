import type { LoadKind, SegmentKind } from '../domain/schema';
import type { MessageKey } from './messages';
export const assetLabels: Record<LoadKind | SegmentKind, MessageKey> = {
  machine: 'kindMachine',
  pallet: 'kindPallet',
  rack: 'kindRack',
  tank: 'kindTank',
  block: 'kindBlock',
  zone: 'kindZone',
  wall: 'kindWall',
  beam: 'kindBeam',
  column: 'kindColumn',
};
