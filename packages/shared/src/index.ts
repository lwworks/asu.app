export type SyncTokenPayload = {
  userId: string;
  orgId: string;
  exp: number;
};

export type OrgRole = "admin" | "member";
