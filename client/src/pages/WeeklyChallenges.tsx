import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Trophy, Calendar, Target, Award, Clock } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function WeeklyChallenges() {
  const { data: challenges, isLoading } = trpc.challenges.getActive.useQuery();
  const { data: userCompletions } = trpc.challenges.getUserCompletions.useQuery();

  const hasCompleted = (challengeId: number) => {
    return userCompletions?.some((uc: any) => uc.challengeId === challengeId) || false;
  };

  const getDaysRemaining = (endDate: Date) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8" />
          Weekly Challenges
        </h1>
        <p className="text-muted-foreground mt-2">
          Complete challenges to earn bonus AI credits and achievements
        </p>
      </div>

      {/* Active Challenges */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {challenges && challenges.length > 0 ? (
          challenges.map((challenge: any) => {
            const completed = hasCompleted(challenge.id);
            const daysLeft = getDaysRemaining(challenge.endDate);
            
            return (
              <Card key={challenge.id} className={completed ? "border-primary/50 bg-primary/5" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {challenge.title}
                        {completed && (
                          <Badge variant="default" className="ml-auto">
                            <Trophy className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">{challenge.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Challenge Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span>Target Score: <strong>{challenge.targetScore.toLocaleString()}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="w-4 h-4 text-muted-foreground" />
                      <span>Reward: <strong>{challenge.reward} AI Credits</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {daysLeft > 0 ? (
                          <>{daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining</>
                        ) : (
                          <span className="text-destructive">Expired</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  {completed ? (
                    <Button variant="outline" className="w-full" disabled>
                      <Trophy className="w-4 h-4 mr-2" />
                      Challenge Completed
                    </Button>
                  ) : daysLeft > 0 ? (
                    <Link href={`/games/${challenge.gameName}`}>
                      <Button className="w-full">
                        Start Challenge
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      Challenge Expired
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Challenges</h3>
              <p className="text-muted-foreground">
                Check back soon for new weekly challenges!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Completed Challenges */}
      {userCompletions && userCompletions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Your Completions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {userCompletions.map((completion: any) => (
              <Card key={completion.id} className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-primary" />
                    Challenge #{completion.challengeId}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Score:</span>
                      <strong>{completion.score.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed:</span>
                      <span>{new Date(completion.completedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reward:</span>
                      <Badge variant={completion.rewardClaimed ? "default" : "secondary"}>
                        {completion.rewardClaimed ? "Claimed" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
