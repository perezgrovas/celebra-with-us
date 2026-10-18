import type { WeddingConfig } from "./config";
export type AssetKind = "photo" | "background" | "font";
export type Asset = {
  id: string;
  wedding_id: string;
  kind: AssetKind;
  name: string;
  path: string;
  url: string;
  family: string | null;
  alt: string;
  created_at: string;
};
export type Wedding = {
  id: string;
  owner_id: string;
  slug: string;
  config: WeddingConfig;
  published_config: WeddingConfig | null;
  published: boolean;
  version: number;
  updated_at: string;
};
export type Group = {
  id: string;
  wedding_id: string;
  display_name: string;
  token: string;
  seats: number;
};
export type Guest = {
  id: string;
  wedding_id: string;
  group_id: string;
  name: string;
  status: "pending" | "attending" | "declined";
  dietary: string;
  companion_name: string;
  table_id: string | null;
};
export type WeddingTable = {
  id: string;
  wedding_id: string;
  name: string;
  capacity: number;
};
export type PublicGuest = Pick<
  Guest,
  "id" | "name" | "status" | "dietary" | "companion_name"
> & { table_name: string | null };
export type PublicInvitation = {
  config: WeddingConfig;
  assets: Asset[];
  group: { display_name: string; seats: number } | null;
  guests: PublicGuest[];
};
