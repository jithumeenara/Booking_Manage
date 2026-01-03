import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Link as LinkIcon, Mail, Send } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function BookingLinks() {
  const [departmentName, setDepartmentName] = useState("");
  const [email, setEmail] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  const generateBookingLink = async () => {
    if (!departmentName.trim()) {
      toast.error("Please enter a department name");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/booking-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          department_name: departmentName.trim(),
          email: email.trim() || null
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate link');
      }

      const data = await res.json();
      const link = `${window.location.origin}/public-booking/${data.token}`;
      setGeneratedLink(link);
      toast.success("Reusable booking link generated successfully!");
    } catch (error: any) {
      console.error("Error generating link:", error);
      toast.error(error.message || "Failed to generate booking link");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success("Link copied to clipboard!");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Generate Booking Link</h1>
            
            <Card>
              <CardHeader>
                <CardTitle>Create Reusable Booking Link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="department">Department Name</Label>
                  <Input
                    id="department"
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    placeholder="Enter department name"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email to send link"
                  />
                </div>

                <Button 
                  onClick={generateBookingLink} 
                  disabled={isGenerating}
                  className="w-full"
                >
                  <LinkIcon className="mr-2 h-4 w-4" />
                  {isGenerating ? "Generating..." : "Generate Link"}
                </Button>

                {generatedLink && (
                  <div className="mt-6 p-4 bg-muted rounded-lg space-y-3">
                    <Label className="text-sm font-medium mb-2 block">Generated Link:</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={generatedLink} 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button 
                        onClick={copyToClipboard}
                        variant="outline"
                        size="icon"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This link can be used multiple times for booking submissions.
                    </p>
                    
                    {email && (
                      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <Mail className="mr-2 h-4 w-4" />
                            Send Link via Email
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Send Booking Link</DialogTitle>
                            <DialogDescription>
                              Send the booking link to {email}?
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <p className="text-sm text-muted-foreground">
                              The booking link will be sent to the provided email address.
                            </p>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setShowEmailDialog(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={async () => {
                                setIsSendingEmail(true);
                                try {
                                  const res = await fetch('/api/booking-links/send-email', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                    body: JSON.stringify({
                                      email,
                                      link: generatedLink,
                                      departmentName
                                    }),
                                  });
                                  
                                  if (!res.ok) {
                                    const data = await res.json();
                                    throw new Error(data.error || 'Failed to send email');
                                  }
                                  
                                  toast.success(`Link sent to ${email}`);
                                  setShowEmailDialog(false);
                                } catch (error: any) {
                                  toast.error(error.message || "Failed to send email");
                                  console.error('Send email error:', error);
                                } finally {
                                  setIsSendingEmail(false);
                                }
                              }}
                              disabled={isSendingEmail}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              {isSendingEmail ? "Sending..." : "Send Email"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
