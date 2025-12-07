// client/src/pages/Profile.tsx
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, Upload, ChevronLeft, Save } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [uploading, setUploading] = useState(false);

  const { data: profileData, isLoading, refetch } = trpc.profile.me.useQuery();
  const updateProfileMutation = trpc.profile.update.useMutation();
  const uploadResumeMutation = trpc.resume.upload.useMutation();

  const [formData, setFormData] = useState({
    fullName: "",
    city: "",
    country: "",
    minSalary: "",
    maxSalary: "",
    currency: "USD",
    experienceYears: "",
    currentRoleTitle: "",
    desiredTitle: "",
    workModePreferences: [] as string[],
    skills: "",
  });

  // Load profile data when available
  useEffect(() => {
    if (profileData?.profile) {
      const profile = profileData.profile;
      setFormData({
        fullName: profile.fullName || "",
        city: profile.city || "",
        country: profile.country || "",
        minSalary: profile.minSalary?.toString() || "",
        maxSalary: profile.maxSalary?.toString() || "",
        currency: profile.currency || "USD",
        experienceYears: profile.experienceYears?.toString() || "",
        currentRoleTitle: profile.currentRoleTitle || "",
        desiredTitle: profile.desiredTitle || "",
        workModePreferences: (profile.workModePreferences as string[]) || [],
        skills: Array.isArray(profile.skills) ? profile.skills.join(", ") : "",
      });
    }
  }, [profileData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleWorkModeToggle = (mode: string) => {
    setFormData(prev => ({
      ...prev,
      workModePreferences: prev.workModePreferences.includes(mode)
        ? prev.workModePreferences.filter(m => m !== mode)
        : [...prev.workModePreferences, mode]
    }));
  };

  const handleProfileSubmit = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        fullName: formData.fullName,
        city: formData.city,
        country: formData.country,
        minSalary: formData.minSalary ? parseInt(formData.minSalary) : undefined,
        maxSalary: formData.maxSalary ? parseInt(formData.maxSalary) : undefined,
        currency: formData.currency,
        experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : undefined,
        currentRoleTitle: formData.currentRoleTitle,
        desiredTitle: formData.desiredTitle,
        workModePreferences: formData.workModePreferences,
        skills: formData.skills ? formData.skills.split(",").map(s => s.trim()) : [],
      });
      toast.success("Profile updated successfully!");
      refetch();
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or DOCX file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result?.toString().split(",")[1];
        if (!base64Data) {
          toast.error("Failed to read file");
          setUploading(false);
          return;
        }

        await uploadResumeMutation.mutateAsync({
          filename: file.name,
          mimeType: file.type,
          base64Data,
          parsedText: "CV content will be parsed on the server",
        });

        toast.success("CV uploaded successfully!");
        setUploading(false);
        refetch();
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to upload CV");
      console.error(error);
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
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
          <h1 className="text-xl font-bold">Edit Profile</h1>
          <div className="w-20" />
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your job search preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="San Francisco"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  placeholder="USA"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Salary Range (Annual)</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={formData.minSalary}
                  onChange={(e) => handleInputChange("minSalary", e.target.value)}
                  placeholder="Min"
                  type="number"
                />
                <Input
                  value={formData.maxSalary}
                  onChange={(e) => handleInputChange("maxSalary", e.target.value)}
                  placeholder="Max"
                  type="number"
                />
                <Select value={formData.currency} onValueChange={(v) => handleInputChange("currency", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experienceYears">Years of Experience</Label>
              <Input
                id="experienceYears"
                value={formData.experienceYears}
                onChange={(e) => handleInputChange("experienceYears", e.target.value)}
                placeholder="5"
                type="number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentRole">Current Role</Label>
              <Input
                id="currentRole"
                value={formData.currentRoleTitle}
                onChange={(e) => handleInputChange("currentRoleTitle", e.target.value)}
                placeholder="Senior Software Engineer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desiredRole">Desired Role</Label>
              <Input
                id="desiredRole"
                value={formData.desiredTitle}
                onChange={(e) => handleInputChange("desiredTitle", e.target.value)}
                placeholder="Lead Engineer"
              />
            </div>

            <div className="space-y-2">
              <Label>Work Mode Preferences</Label>
              <div className="flex gap-4">
                {["remote", "hybrid", "onsite"].map((mode) => (
                  <div key={mode} className="flex items-center gap-2">
                    <Checkbox
                      id={mode}
                      checked={formData.workModePreferences.includes(mode)}
                      onCheckedChange={() => handleWorkModeToggle(mode)}
                    />
                    <Label htmlFor={mode} className="capitalize cursor-pointer">
                      {mode}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input
                id="skills"
                value={formData.skills}
                onChange={(e) => handleInputChange("skills", e.target.value)}
                placeholder="JavaScript, React, Node.js, Python"
              />
            </div>

            <Button 
              onClick={handleProfileSubmit} 
              className="w-full"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Profile
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Resume Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Resume / CV</CardTitle>
            <CardDescription>
              {profileData?.resume 
                ? `Current file: ${profileData.resume.originalFilename}` 
                : "Upload your resume for better job matching"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <Label htmlFor="cv-upload" className="cursor-pointer">
                <span className="text-purple-600 hover:text-purple-700 font-medium">
                  Click to upload
                </span>
                <span className="text-gray-600"> or drag and drop</span>
              </Label>
              <p className="text-xs text-gray-500 mt-2">PDF or DOCX (max 10MB)</p>
              <Input
                id="cv-upload"
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </div>

            {uploading && (
              <div className="flex items-center justify-center gap-2 text-purple-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading your CV...</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
