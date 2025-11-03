import { useTranslation } from "react-i18next";
import { useVotes } from "@/lib/hooks/useVotes";
import { useToggleVoteMutation } from "@/lib/hooks/useVoteMutation";
import { Button } from "@/components/ui/button";

interface VotingSectionProps {
  tourId: string;
  currentUserId: string;
  areVotesHidden?: boolean;
}

export const VotingSection = ({ tourId, currentUserId, areVotesHidden = false }: VotingSectionProps) => {
  const { t } = useTranslation("tours");
  const { data: votes, isLoading } = useVotes(tourId);
  const toggleVoteMutation = useToggleVoteMutation(tourId, currentUserId);

  const userHasVoted = votes?.users.includes(currentUserId) ?? false;

  const handleVote = () => {
    if (areVotesHidden) {
      alert(t("voting.votingDisabledAlert"));
      return;
    }
    toggleVoteMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="card bg-base-200 p-6">
        <div className="skeleton h-20 w-full"></div>
      </div>
    );
  }

  return (
    <div className="card bg-base-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("voting.title")}</h3>
          <p className="text-3xl font-bold text-primary">{votes?.count || 0}</p>
          {areVotesHidden && <p className="text-sm text-warning">{t("voting.votingDisabled")}</p>}
        </div>
        <Button
          size="lg"
          variant={userHasVoted ? "default" : "outline"}
          onClick={handleVote}
          disabled={areVotesHidden || toggleVoteMutation.isPending}
        >
          {toggleVoteMutation.isPending ? "..." : userHasVoted ? `❤️ ${t("voting.liked")}` : `🤍 ${t("voting.like")}`}
        </Button>
      </div>
    </div>
  );
};
