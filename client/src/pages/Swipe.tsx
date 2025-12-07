// client/src/pages/Swipe.tsx
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { 
  ThumbsDown, 
  ThumbsUp, 
  Undo2, 
  MapPin, 
  DollarSign, 
  Briefcase,
  Building2,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Swipe() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showDetails, setShowDetails] = useState(false);

  const { data, isLoading, refetch } = trpc.swipe.next.useQuery();
  const decisionMutation = trpc.swipe.decision.useMutation();
  const undoMutation = trpc.swipe.undo.useMutation();

  const job = data?.job;
  const aiMatch = data?.aiMatch;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handleSwipe("dislike");
      } else if (e.key === "ArrowRight") {
        handleSwipe("like");
      } else if (e.key === "z" || e.key === "Z") {
        handleUndo();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [job]);

  const handleSwipe = async (decision: "like" | "dislike") => {
    if (!job) return;

    try {
      await decisionMutation.mutateAsync({
        jobId: job.id,
        decision,
        aiQualified: aiMatch?.qualified,
        aiReason: aiMatch?.reason,
      });

      toast.success(
        decision === "like" 
          ? "Application queued! ✨" 
          : "Job passed"
      );

      // Fetch next job
      refetch();
    } catch (error) {
      toast.error("Failed to record decision");
      console.error(error);
    }
  };

  const handleUndo = async () => {
    try {
      await undoMutation.mutateAsync();
      toast.success("Last swipe undone");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to undo");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto" />
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold">No More Jobs</h2>
            <p className="text-gray-600">
              You've seen all available jobs matching your preferences. Check back later for new opportunities!
            </p>
            <Button onClick={() => setLocation("/dashboard/history")} className="w-full">
              View Application History
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation("/dashboard")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
          <h1 className="text-xl font-bold">Swipe Jobs</h1>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleUndo}
            disabled={undoMutation.isPending}
          >
            <Undo2 className="h-4 w-4 mr-1" />
            Undo
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Keyboard Shortcuts Hint */}
        <div className="text-center mb-4 text-sm text-gray-500">
          Use ← → arrow keys to swipe, Z to undo
        </div>

        {/* Job Card */}
        <Card className="shadow-xl border-2">
          <CardHeader className="space-y-4">
            {/* Company Logo & Name */}
            <div className="flex items-start gap-4">
              {job.companyLogoUrl ? (
                <img 
                  src={job.companyLogoUrl} 
                  alt={job.companyName}
                  className="w-16 h-16 rounded-lg object-cover border"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-purple-600" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{job.title}</h2>
                <p className="text-lg text-gray-600">{job.companyName}</p>
              </div>
            </div>

            {/* Job Details */}
            <div className="flex flex-wrap gap-2">
              {job.city && job.country && (
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.city}, {job.country}
                </Badge>
              )}
              {job.salaryMin && job.salaryMax && (
                <Badge variant="secondary" className="gap-1">
                  <DollarSign className="h-3 w-3" />
                  {job.currency} {job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()}
                </Badge>
              )}
              {job.workMode && (
                <Badge variant="secondary" className="gap-1">
                  <Briefcase className="h-3 w-3" />
                  {job.workMode}
                </Badge>
              )}
              {job.employmentType && (
                <Badge variant="secondary">
                  {job.employmentType}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* AI Match Result */}
            {aiMatch && (
              <div className={`p-4 rounded-lg border-2 ${
                aiMatch.qualified 
                  ? "bg-green-50 border-green-200" 
                  : "bg-orange-50 border-orange-200"
              }`}>
                <div className="flex items-start gap-3">
                  {aiMatch.qualified ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-semibold ${
                      aiMatch.qualified ? "text-green-900" : "text-orange-900"
                    }`}>
                      {aiMatch.qualified ? "You're Qualified! ✨" : "Qualification Check"}
                    </p>
                    <p className={`text-sm mt-1 ${
                      aiMatch.qualified ? "text-green-700" : "text-orange-700"
                    }`}>
                      {aiMatch.reason}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Job Summary */}
            {job.summary && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
                <p className="text-gray-700">{job.summary}</p>
              </div>
            )}

            {/* Perks */}
            {job.perks && Object.keys(job.perks).length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Perks & Benefits</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(job.perks)
                    .filter(([_, value]) => value)
                    .map(([key]) => (
                      <Badge key={key} variant="outline">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            {/* Details Button */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowDetails(true)}
            >
              View Full Description
            </Button>

            {/* Swipe Actions */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleSwipe("dislike")}
                disabled={decisionMutation.isPending}
                className="border-2 hover:border-red-300 hover:bg-red-50"
              >
                <ThumbsDown className="h-5 w-5 mr-2" />
                Not Interested
              </Button>
              <Button
                size="lg"
                onClick={() => handleSwipe("like")}
                disabled={decisionMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <ThumbsUp className="h-5 w-5 mr-2" />
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Description Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{job.title}</DialogTitle>
            <DialogDescription>{job.companyName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Full Description</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {job.description || "No detailed description available."}
              </p>
            </div>
            {job.applyUrl && (
              <div>
                <h4 className="font-semibold mb-2">Application URL</h4>
                <a 
                  href={job.applyUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-purple-600 hover:underline"
                >
                  {job.applyUrl}
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
