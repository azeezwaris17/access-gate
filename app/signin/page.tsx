"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";
import api from "@/lib/services/api";

// Material UI Components
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  FormControlLabel,
  Checkbox,
  Link,
  Divider,
  Paper,
  CircularProgress,
} from "@mui/material";

// Material UI Icons
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  // Security,
} from "@mui/icons-material";
import Image from "next/image";

/**
 * Zod schema for form validation
 * Defines the shape and validation rules for the sign-in form
 */
const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean(),
});

// Infer TypeScript type from Zod schema
type SignInForm = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state to true after component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * React Hook Form configuration
   * - zodResolver: Integrates Zod validation with react-hook-form
   */
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  /**
   * Handle form submission
   * @param data - Validated form data from Zod schema
   */
  const onSubmit = async (data: SignInForm) => {
    setIsLoading(true);

    try {
      // API call using the configured api service
      const response = await api.post("/v1/auth/login", {
        email: data.email.toLowerCase().trim(),
        password: data.password,
        rememberMe: data.rememberMe,
      });

      // Extract response data
      const { token, admin } = response.data;

      // Update auth store with user information
      setAuth(token, {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
      });

      // Show success notification
      toast.success(`Welcome back, ${admin?.fullName || "Admin"}!`);

      // Redirect to dashboard with smooth transition
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error: unknown) {
      // Comprehensive error handling
      let errorMessage = "Login failed. Please check your credentials.";

      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { 
          response?: { 
            data?: { 
              error?: string; 
              message?: string;
              field?: string;
            }; 
            status?: number;
          };
        };
        
        // Use message or error field from response
        const serverMessage = apiError.response?.data?.message || apiError.response?.data?.error;
        if (serverMessage) {
          errorMessage = serverMessage;

          // Handle field-specific errors if provided by backend
          const fieldName = apiError.response?.data?.field;
          if (fieldName && (fieldName === 'email' || fieldName === 'password')) {
            setError(fieldName as keyof SignInForm, {
              type: "server",
              message: serverMessage,
            });
          } else {
            // If no specific field, show general error toast
            toast.error(errorMessage);
          }
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggle password visibility
   */
  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!isMounted) {
    return (
      <Container
        component="main"
        maxWidth="sm"
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
          backgroundColor: "#f5f7fa",
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container
      component="main"
      maxWidth="sm"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
        backgroundColor: "#f5f7fa",
      }}
    >
      <Box sx={{ width: "100%" }}>
        {/* Main Sign In Card */}
        <Card
          elevation={8}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            background: "white",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header Section */}
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Paper
                elevation={4}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 80,
                  height: 80,
                  borderRadius: 2,
                  // backgroundColor: "#2196F3",
                  mb: 3,
                }}
              >
                {/* <Security sx={{ fontSize: 40, color: "white" }} /> */}
                 <Image
              src="/access-gate-favicon-2.png"
              alt="Access Gate Logo"
              width={60}
              height={60}
              style={{ objectFit: 'contain' }}
            />
              </Paper>

              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: "bold",
                  color: "text.primary",
                }}
              >
                Welcome Back
              </Typography>
            </Box>

            {/* Sign In Form */}
            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              sx={{ mt: 1 }}
            >
              {/* Email Field */}
              <TextField
                {...register("email")}
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                error={!!errors.email}
                helperText={errors.email?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color={errors.email ? "error" : "action"} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              {/* Password Field */}
              <TextField
                {...register("password")}
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="current-password"
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color={errors.password ? "error" : "action"} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              {/* Remember Me & Forgot Password */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox {...register("rememberMe")} color="primary" />
                  }
                  label="Remember me"
                />
                <Link
                  href="/forgot-password"
                  variant="body2"
                  sx={{
                    textDecoration: "none",
                    color: "primary.main",
                    fontWeight: "medium",
                    "&:hover": {
                      color: "primary.dark",
                    },
                  }}
                >
                  Forgot password?
                </Link>
              </Box>

              {/* Sign In Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{
                  mt: 1,
                  mb: 2,
                  py: 1.5,
                  background:
                    "linear-gradient(45deg, #2196F3 0%, #21CBF3 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(45deg, #1976D2 0%, #00ACC1 100%)",
                    transform: "translateY(-1px)",
                    boxShadow: 4,
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1, color: "white" }} />
                    Signing In...
                  </>
                ) : (
                  "Sign In to Dashboard"
                )}
              </Button>

              {/* Divider and Sign up Link */}
              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Don&apos;t have an account?
                </Typography>
              </Divider>
              
              <Box sx={{ textAlign: "center" }}>
                <Link
                  href="/signup"
                  variant="body1"
                  sx={{
                    textDecoration: "none",
                    color: "primary.main",
                    fontWeight: "medium",
                    "&:hover": {
                      color: "primary.dark",
                    },
                  }}
                >
                  Create new account
                </Link>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}