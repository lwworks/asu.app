import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./auth";

export type Org = {
  orgId: string;
  name: string;
  slug: string;
  role: string;
  logoUrl: string | null;
};

type OrgContextValue = {
  orgs: Org[];
  currentOrg: Org | null;
  syncToken: string | null;
  isLoading: boolean;
  switchOrg: (orgId: string) => Promise<void>;
  refreshOrgs: () => Promise<Org[] | undefined>;
};

const OrgContext = createContext<OrgContextValue | null>(null);

const AUTH_URL = import.meta.env.VITE_AUTH_URL;
const CURRENT_ORG_KEY = "asu-current-org-id";

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Org | null>(null);
  const [syncToken, setSyncToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSyncToken = useCallback(async (orgId: string) => {
    const res = await fetch(`${AUTH_URL}/api/sync-token?orgId=${orgId}`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token as string;
  }, []);

  const refreshOrgs = useCallback(async () => {
    const res = await fetch(`${AUTH_URL}/api/orgs`, {
      credentials: "include",
    });
    if (!res.ok) return;
    const data = (await res.json()) as Org[];
    setOrgs(data);
    setCurrentOrg((prev) =>
      prev ? data.find((o) => o.orgId === prev.orgId) ?? prev : prev
    );
    return data;
  }, []);

  const switchOrg = useCallback(
    async (orgId: string) => {
      let org = orgs.find((o) => o.orgId === orgId);
      if (!org) {
        const fresh = await refreshOrgs();
        org = fresh?.find((o) => o.orgId === orgId);
      }
      if (!org) return;
      const token = await fetchSyncToken(orgId);
      setCurrentOrg(org);
      setSyncToken(token);
      localStorage.setItem(CURRENT_ORG_KEY, orgId);
    },
    [orgs, fetchSyncToken, refreshOrgs]
  );

  // Load orgs on user change
  useEffect(() => {
    if (!user) {
      setOrgs([]);
      setCurrentOrg(null);
      setSyncToken(null);
      setIsLoading(false);
      return;
    }

    (async () => {
      setIsLoading(true);
      const data = await refreshOrgs();
      if (!data || data.length === 0) {
        setIsLoading(false);
        return;
      }

      const savedOrgId = localStorage.getItem(CURRENT_ORG_KEY);
      const targetOrg =
        data.find((o) => o.orgId === savedOrgId) ?? data[0];

      const token = await fetchSyncToken(targetOrg.orgId);
      setCurrentOrg(targetOrg);
      setSyncToken(token);
      setIsLoading(false);
    })();
  }, [user, refreshOrgs, fetchSyncToken]);

  return (
    <OrgContext.Provider
      value={{ orgs, currentOrg, syncToken, isLoading, switchOrg, refreshOrgs }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within OrgProvider");
  return ctx;
}

export function OrgGate({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  const { currentOrg, isLoading } = useOrg();
  if (isLoading) return null;
  if (!currentOrg) return fallback;
  return children;
}
