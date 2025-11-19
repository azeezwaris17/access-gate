// lib/hocs/withAuth.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { CircularProgress, Box, Typography, Container } from "@mui/material";

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredRole?: string
) {
  return function AuthenticatedComponent(props: P) {
    const router = useRouter();
    const { token, admin, isAuthenticated, isLoading, checkSession } = useAuthStore();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
      const checkAuth = () => {
        // Wait for auth store to initialize
        if (isLoading) return;

        // Check session validity
        if (!checkSession()) {
          router.push("/signin?redirect=/gate&session=expired");
          return;
        }

        if (!isAuthenticated || !token) {
          router.push("/signin?redirect=/gate");
          return;
        }

        // Check role if required
        if (requiredRole && admin?.role !== requiredRole) {
          router.push("/unauthorized");
          return;
        }

        setIsChecking(false);
      };

      checkAuth();
    }, [isAuthenticated, token, admin, isLoading, router, checkSession]);

    if (isChecking || isLoading) {
      return (
        <Container
          component="main"
          maxWidth="sm"
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <CircularProgress size={60} sx={{ mb: 3, color: "primary.main" }} />
            <Typography variant="h6" color="text.secondary" fontWeight="medium">
              Verifying access...
            </Typography>
          </Box>
        </Container>
      );
    }

    return <WrappedComponent {...props} />;
  };
}