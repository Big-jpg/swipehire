// client/src/pages/History.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { 
  ChevronLeft, 
  ThumbsUp, 
  ThumbsDown, 
  MapPin, 
  DollarSign,
  Loader2,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function History() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("applications");

  const { data: swipesData, isLoading: swipesLoading } = trpc.history.swipes.useQuery();
  const { data: applicationsData, isLoading: applicationsLoading } = trpc.history.applications.useQuery();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-green-100 text-green-800 border-green-200";
      case "queued":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
        return <CheckCircle2 className="h-4 w-4" />;
      case "queued":
        return <Clock className="h-4 w-4" />;
      case "failed":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

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
          <h1 className="text-xl font-bold">History</h1>
          <div className="w-20" /> {/* Spacer for alignment */}
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="swipes">All Swipes</TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-4">
            {applicationsLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading applications...</p>
              </div>
            ) : applicationsData && applicationsData.length > 0 ? (
              applicationsData.map((item) => {
                const app = item.application;
                const job = item.job;
                
                if (!job) return null;

                return (
                  <Card key={app.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Company Logo */}
                        {job.companyLogoUrl ? (
                          <img 
                            src={job.companyLogoUrl} 
                            alt={job.companyName}
                            className="w-12 h-12 rounded-lg object-cover border flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-6 w-6 text-purple-600" />
                          </div>
                        )}

                        {/* Job Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>
                              <p className="text-gray-600">{job.companyName}</p>
                            </div>
                            <Badge className={`${getStatusColor(app.status)} gap-1 flex-shrink-0`}>
                              {getStatusIcon(app.status)}
                              {app.status}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-2">
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
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>
                              Applied {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                            </span>
                            {app.submittedAt && (
                              <span>
                                Submitted {formatDistanceToNow(new Date(app.submittedAt), { addSuffix: true })}
                              </span>
                            )}
                          </div>

                          {app.failureReason && (
                            <p className="text-sm text-red-600 mt-2">
                              {app.failureReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start swiping on jobs to build your application history
                  </p>
                  <Button onClick={() => setLocation("/dashboard/swipe")}>
                    Start Swiping
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* All Swipes Tab */}
          <TabsContent value="swipes" className="space-y-4">
            {swipesLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading swipes...</p>
              </div>
            ) : swipesData && swipesData.length > 0 ? (
              swipesData.map((item) => {
                const swipe = item.swipe;
                const job = item.job;
                
                if (!job) return null;

                return (
                  <Card key={swipe.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Company Logo */}
                        {job.companyLogoUrl ? (
                          <img 
                            src={job.companyLogoUrl} 
                            alt={job.companyName}
                            className="w-12 h-12 rounded-lg object-cover border flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-6 w-6 text-purple-600" />
                          </div>
                        )}

                        {/* Job Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>
                              <p className="text-gray-600">{job.companyName}</p>
                            </div>
                            <Badge 
                              variant={swipe.decision === "like" ? "default" : "secondary"}
                              className="gap-1 flex-shrink-0"
                            >
                              {swipe.decision === "like" ? (
                                <>
                                  <ThumbsUp className="h-3 w-3" />
                                  Liked
                                </>
                              ) : (
                                <>
                                  <ThumbsDown className="h-3 w-3" />
                                  Passed
                                </>
                              )}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-2">
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
                          </div>

                          {swipe.qualifiedReason && (
                            <p className="text-sm text-gray-600 mt-2">
                              <span className="font-medium">AI Match:</span> {swipe.qualifiedReason}
                            </p>
                          )}

                          <p className="text-sm text-gray-500 mt-2">
                            {formatDistanceToNow(new Date(swipe.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Swipes Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start swiping on jobs to build your history
                  </p>
                  <Button onClick={() => setLocation("/dashboard/swipe")}>
                    Start Swiping
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
