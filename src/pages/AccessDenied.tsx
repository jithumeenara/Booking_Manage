import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Home, Mail } from "lucide-react";

export default function AccessDenied() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/5 p-4">
            <Card className="max-w-md w-full border-2 border-destructive/20">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                        <ShieldAlert className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl">Access Denied</CardTitle>
                    <CardDescription className="text-base">
                        You don't have permission to access this page.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Need Access?
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Contact your system administrator to request access to this feature.
                            They can grant you the necessary permissions from the Settings page.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={() => navigate('/')}
                            className="flex-1"
                            variant="default"
                        >
                            <Home className="h-4 w-4 mr-2" />
                            Go to Dashboard
                        </Button>
                        <Button
                            onClick={() => navigate(-1)}
                            variant="outline"
                            className="flex-1"
                        >
                            Go Back
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
