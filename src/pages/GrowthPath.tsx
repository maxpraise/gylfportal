import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Award, Star, Trophy, Crown, Target, Zap, CheckCircle2, Lock, ArrowRight } from "lucide-react";

interface GrowthPath {
  id: string;
  name: string;
  level: number;
  description: string;
  min_referrals: number;
  badge_color: string;
}

const levelIcons = [Star, Award, Zap, Trophy, Crown, Target];

const GrowthPath = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [levels, setLevels] = useState<GrowthPath[]>([]);
  const [currentLevel, setCurrentLevel] = useState<GrowthPath | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLevels = async () => {
      const { data } = await supabase.from("growth_paths").select("*").order("level");

      if (data) {
        setLevels(data);

        // Find current level
        if (profile?.current_level_id) {
          const current = data.find((l) => l.id === profile.current_level_id);
          setCurrentLevel(current || data[0]);
        } else {
          setCurrentLevel(data[0]);
        }
      }
      setIsLoading(false);
    };

    fetchLevels();
  }, [profile]);

  const getProgressToLevel = (level: GrowthPath) => {
    const referrals = profile?.total_referrals || 0;
    if (referrals >= level.min_referrals) return 100;

    const prevLevel = levels.find((l) => l.level === level.level - 1);
    const prevMin = prevLevel?.min_referrals || 0;
    const range = level.min_referrals - prevMin;
    const progress = referrals - prevMin;

    return Math.max(0, Math.min((progress / range) * 100, 100));
  };

  const isLevelCompleted = (level: GrowthPath) => {
    return (profile?.total_referrals || 0) >= level.min_referrals;
  };

  const isCurrentLevel = (level: GrowthPath) => {
    if (!currentLevel) return level.level === 1;
    return level.id === currentLevel.id;
  };

  const isLevelLocked = (level: GrowthPath) => {
    const referrals = profile?.total_referrals || 0;
    const prevLevel = levels.find((l) => l.level === level.level - 1);
    if (!prevLevel) return false;
    return referrals < prevLevel.min_referrals;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading growth path...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Growth Path</h1>
          <p className="text-muted-foreground mt-1">Track your leadership journey and unlock new levels</p>
        </div>
        <Button onClick={() => navigate("/dashboard/invite")}>
          Level Up
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Current Status */}
      <Card className="border-border bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary rounded-full p-4">
                {currentLevel &&
                  (() => {
                    const Icon = levelIcons[currentLevel.level - 1] || Award;
                    return <Icon className="h-8 w-8 text-primary-foreground" />;
                  })()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{currentLevel?.name || "New Ambassador"}</h2>
                <p className="text-muted-foreground">Level {currentLevel?.level || 1}</p>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Your Referrals</span>
                <span className="font-medium text-foreground">{profile?.total_referrals || 0}</span>
              </div>
              <Progress
                value={
                  currentLevel
                    ? getProgressToLevel(levels.find((l) => l.level === currentLevel.level + 1) || currentLevel)
                    : 0
                }
                className="h-3"
              />
              {currentLevel && levels.find((l) => l.level === currentLevel.level + 1) && (
                <p className="text-xs text-muted-foreground mt-2">
                  {Math.max(
                    0,
                    (levels.find((l) => l.level === currentLevel.level + 1)?.min_referrals || 0) -
                      (profile?.total_referrals || 0),
                  )}{" "}
                  more referrals to reach {levels.find((l) => l.level === currentLevel.level + 1)?.name}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Levels Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {levels.map((level) => {
          const Icon = levelIcons[level.level - 1] || Award;
          const completed = isLevelCompleted(level);
          const current = isCurrentLevel(level);
          const locked = isLevelLocked(level);

          return (
            <Card
              key={level.id}
              className={`border-border transition-all ${
                current ? "ring-2 ring-primary shadow-lg" : ""
              } ${locked ? "opacity-60" : ""}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div
                    className={`p-3 rounded-full ${
                      completed
                        ? "bg-chart-1/20 text-chart-1"
                        : current
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {locked ? (
                      <Lock className="h-6 w-6" />
                    ) : completed ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  <Badge variant={completed ? "default" : current ? "secondary" : "outline"}>Level {level.level}</Badge>
                </div>
                <CardTitle className="text-lg mt-3">{level.name}</CardTitle>
                <CardDescription>{level.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Required Membership</span>
                    <span className="font-medium text-foreground">{level.min_referrals}</span>
                  </div>

                  {!locked && (
                    <>
                      <Progress value={getProgressToLevel(level)} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {Math.min(profile?.total_referrals || 0, level.min_referrals)} / {level.min_referrals}
                        </span>
                        {completed && (
                          <span className="text-chart-1 font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </span>
                        )}
                        {current && !completed && <span className="text-primary font-medium">Current Level</span>}
                      </div>
                    </>
                  )}

                  {locked && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Complete previous level to unlock
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Call to Action */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Ready to level up?</h3>
              <p className="text-muted-foreground">
                Invite more members to grow your network and unlock new achievements.
              </p>
            </div>
            <Button onClick={() => navigate("/dashboard/invite")}>
              Start Inviting
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GrowthPath;
