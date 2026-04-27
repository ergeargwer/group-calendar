import { useState } from "react";
import { useCreateUser } from "@workspace/api-client-react";
import { setIdentity } from "../lib/identity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const DEFAULT_EMOJI = "👤";

export function SetupScreen({ onComplete }: { onComplete: () => void }) {
  const [nickname, setNickname] = useState("");

  const createUser = useCreateUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    createUser.mutate(
      { data: { nickname: nickname.trim(), emoji: DEFAULT_EMOJI } },
      {
        onSuccess: (user) => {
          setIdentity(user);
          onComplete();
        }
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-4 border-primary/20 shadow-xl shadow-primary/10 rounded-3xl overflow-hidden">
        <CardHeader className="text-center pb-2 bg-muted/30 pt-8">
          <CardTitle className="text-3xl font-black text-primary tracking-tight">你是誰？</CardTitle>
          <CardDescription className="text-base text-muted-foreground font-medium mt-2">
            請輸入你的暱稱，讓朋友認識你
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <Label htmlFor="nickname" className="text-lg font-bold text-foreground">暱稱</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="例如：小明、Vivian"
                className="text-lg py-6 rounded-2xl bg-background border-2 border-border focus-visible:ring-primary focus-visible:ring-offset-2"
                maxLength={30}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={!nickname.trim() || createUser.isPending}
              className="w-full text-xl py-7 rounded-2xl font-black shadow-lg hover:-translate-y-1 transition-transform"
              size="lg"
            >
              {createUser.isPending ? <Loader2 className="animate-spin w-6 h-6 mr-2" /> : null}
              進入日曆
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
