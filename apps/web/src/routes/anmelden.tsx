import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute({
  component: AnmeldenPage,
});

function AnmeldenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">ASÜ.APP</h1>
          <p className="text-muted-foreground mt-1">Anmelden</p>
        </div>
        <Tabs defaultValue="password">
          <TabsList className="w-full">
            <TabsTrigger value="password" className="flex-1">
              Passwort
            </TabsTrigger>
            <TabsTrigger value="otp" className="flex-1">
              E-Mail-Code
            </TabsTrigger>
          </TabsList>
          <TabsContent value="password">
            <PasswordLogin />
          </TabsContent>
          <TabsContent value="otp">
            <OtpLogin />
          </TabsContent>
        </Tabs>
        <p className="text-center text-sm text-muted-foreground">
          Noch kein Konto?{" "}
          <a href="/registrieren" className="text-foreground underline">
            Registrieren
          </a>
        </p>
      </div>
    </div>
  );
}

function PasswordLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await authClient.signIn.email({
      email,
      password,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error.message ?? "Anmeldung fehlgeschlagen");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-Mail</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Passwort</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "..." : "Anmelden"}
      </Button>
    </form>
  );
}

function OtpLogin() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });
    setLoading(false);
    if (result.error) {
      setError(result.error.message ?? "Fehler beim Senden");
    } else {
      setOtpSent(true);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await authClient.signIn.emailOtp({
      email,
      otp,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error.message ?? "Ungültiger Code");
    }
  };

  if (!otpSent) {
    return (
      <form onSubmit={sendOtp} className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="otp-email">E-Mail</Label>
          <Input
            id="otp-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "..." : "Code senden"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={verifyOtp} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="otp-code">Code</Label>
        <Input
          id="otp-code"
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Code aus der E-Mail"
          required
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "..." : "Bestätigen"}
      </Button>
    </form>
  );
}
