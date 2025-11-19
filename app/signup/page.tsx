"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";
import api from "@/lib/services/api"; // Import the API service instead of axios

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
  CircularProgress,
  Link,
  Divider,
  Paper,
} from "@mui/material";

// Material UI Icons
import {
  Visibility,
  VisibilityOff,
  Person,
  Email,
  Lock,
  Key,
  Info,
  ArrowForward,
  AdminPanelSettings,
} from "@mui/icons-material";

// Zod schema for form validation
const signUpSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(50, "Full name must be less than 50 characters"),
    email: z
      .string()
      .email("Please enter a valid email address")
      .min(1, "Email is required"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    registrationKey: z
      .string()
      .regex(
        /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/,
        "Invalid registration key format (XXXX-XXXX-XXXX-XXXX)"
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Infer TypeScript type from Zod schema
type SignUpForm = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Fix hydration by ensuring component is mounted
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // React Hook Form configuration with Zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      registrationKey: "",
    },
  });

  /**
   * Handle form submission
   * @param data - Validated form data from Zod schema
   */
  const onSubmit = async (data: SignUpForm) => {
    setIsLoading(true);

    try {
      // API call using the configured api service
      const response = await api.post("/auth/register", { // Note: removed /api prefix
        fullName: data.fullName.trim(),
        email: data.email.toLowerCase().trim(),
        password: data.password,
        registrationKey: data.registrationKey.toUpperCase(),
      });

      // Success handling
      const { token, admin } = response.data;
      
      // Set authentication in store - future API calls will automatically use this token
      setAuth(token, {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
      });

      toast.success("Account created successfully! Redirecting...");

      // Redirect to dashboard after successful registration
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error: any) {
      // Error handling with specific error messages
      let errorMessage = "Registration failed. Please try again.";

      // The API service automatically handles 401 errors, so we only handle other errors
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;

        // Handle specific field errors from backend
        if (error.response?.data?.field) {
          setError(error.response.data.field as keyof SignUpForm, {
            type: "server",
            message: error.response.data.error,
          });
        }
      }

      // Show error notification (unless it was a 401 which was already handled)
      if (error.response?.status !== 401) {
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

  /**
   * Toggle confirm password visibility
   */
  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  // Prevent rendering until mounted to avoid hydration mismatch
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
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
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
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      }}
    >
      <Box sx={{ width: "100%" }}>
        {/* Main Card */}
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
                  background:
                    "linear-gradient(45deg, #667eea 0%, #764ba2 100%)",
                  mb: 3,
                }}
              >
                <AdminPanelSettings sx={{ fontSize: 40, color: "white" }} />
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
                Admin Registration
              </Typography>

              {/* <Typography variant="body1" color="text.secondary">
                Create your administrator account
              </Typography> */}
            </Box>

            {/* Registration Form */}
            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              sx={{ mt: 1 }}
            >
              {/* Full Name Field */}
              <TextField
                {...register("fullName")}
                margin="normal"
                required
                fullWidth
                id="fullName"
                label="Full Name"
                name="fullName"
                autoComplete="name"
                autoFocus
                error={!!errors.fullName}
                helperText={errors.fullName?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

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
                error={!!errors.email}
                helperText={errors.email?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
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
                autoComplete="new-password"
                error={!!errors.password}
                helperText={
                  errors.password?.message ||
                  "Must contain uppercase, lowercase, and number"
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
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

              {/* Confirm Password Field */}
              <TextField
                {...register("confirmPassword")}
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                autoComplete="new-password"
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={handleToggleConfirmPassword}
                        edge="end"
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              {/* Registration Key Field */}
              <TextField
                {...register("registrationKey")}
                margin="normal"
                required
                fullWidth
                name="registrationKey"
                label="Admin Registration Key"
                id="registrationKey"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                error={!!errors.registrationKey}
                helperText={
                  errors.registrationKey?.message ||
                  "Format: XXXX-XXXX-XXXX-XXXX (uppercase letters and numbers)"
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Key color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Info color="action" />
                    </InputAdornment>
                  ),
                  sx: {
                    textTransform: "uppercase",
                    fontFamily: "monospace",
                    letterSpacing: 1,
                  },
                }}
                sx={{ mb: 3 }}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                // endIcon={!isLoading && <ArrowForward />}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  background:
                    "linear-gradient(45deg, #667eea 0%, #764ba2 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(45deg, #5a6fd8 0%, #6a4190 100%)",
                    transform: "translateY(-1px)",
                    boxShadow: 4,
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              {/* Divider and Sign up Link */}

              <Divider sx={{ my: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Already have an account?
                  </Typography>

                  <Link
                    href="/signin"
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
                    Sign in to your account
                  </Link>
                </Box>
              </Divider>
            </Box>
          </CardContent>
        </Card>

        {/* Additional Information Card */}
        <Card
          elevation={2}
          sx={{
            mt: 2,
            borderRadius: 2,
            background: "rgba(255, 255, 255, 0.8)",
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              Need a registration key? Contact your system administrator.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}