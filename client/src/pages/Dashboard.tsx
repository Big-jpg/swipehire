// client/src/pages/Dashboard.tsx
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { 
  Heart, 
  User, 
  History, 
  FileText, 
  Loader2,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: profileData, isLoading } = trpc.profile.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
    }
  });

  const hasProfile = !!profileData?.profile;
  const hasResume = !!profileData?.resume;
  const isReady = hasProfile && hasResume;

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  // Redirect to onboarding if profile is incomplete
  if (!isReady) {
    setLocation("/onboarding");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-purple-600 fill-purple-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              SwipeHire
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
            <Button onClick={handleLogout} variant="outline" size="sm">
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">
              Welcome Back, {profileData?.profile?.fullName || user?.name}!
            </h1>
            <p className="text-lg text-gray-600">
              Ready to find your next opportunity?
            </p>
          </div>

          {/* Profile Status */}
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>Keep your profile updated for better job matches</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                {hasProfile ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                )}
                <span className="text-gray-700">
                  Profile {hasProfile ? "complete" : "incomplete"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {hasResume ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                )}
                <span className="text-gray-700">
                  Resume {hasResume ? "uploaded" : "not uploaded"}
                </span>
              </div>
              {profileData?.profile && (
                <div className="pt-2 text-sm text-gray-600 space-y-1">
                  <p>Location: {profileData.profile.city}, {profileData.profile.country}</p>
                  <p>Experience: {profileData.profile.experienceYears} years</p>
                  <p>Desired Role: {profileData.profile.desiredTitle}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Start Swiping */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-300" onClick={() => setLocation("/dashboard/swipe")}>
              <CardContent className="pt-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                  <Heart className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Swiping</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Browse and swipe through job opportunities
                  </p>
                  <Button className="w-full">
                    Swipe Jobs
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* View History */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-300" onClick={() => setLocation("/dashboard/history")}>
              <CardContent className="pt-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center">
                  <History className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">View History</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Check your swipes and applications
                  </p>
                  <Button variant="outline" className="w-full">
                    View History
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Edit Profile */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-300" onClick={() => setLocation("/dashboard/profile")}>
              <CardContent className="pt-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-100 to-purple-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Edit Profile</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Update your preferences and resume
                  </p>
                  <Button variant="outline" className="w-full">
                    Edit Profile
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
