"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  Security,
  ArrowForward,
  Login,
} from "@mui/icons-material";

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
  rememberMe: z.boolean().default(false),
});

// Infer TypeScript type from Zod schema
type SignInForm = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    resolver: zodResolver(signInSchema) as any, // Type assertion to fix version mismatch
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
      // API call using the configured api service (automatically adds auth headers)
      const response = await api.post("/auth/login", { // Note: removed /api prefix since baseURL handles it
        email: data.email.toLowerCase().trim(),
        password: data.password,
        rememberMe: data.rememberMe,
      });

      // Extract response data
      const { token, admin, user } = response.data;

      // Update auth store with user information
      // The API service will now automatically include the token in future requests
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
    } catch (error: any) {
      // Comprehensive error handling
      let errorMessage = "Login failed. Please check your credentials.";

      // Since we're using the api service, 401 errors are already handled by the interceptor
      // We only need to handle other types of errors here
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;

        // Set field-specific errors from backend with proper typing
        if (error.response?.data?.field) {
          const fieldName = error.response.data.field as keyof SignInForm;
          setError(fieldName, {
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
                  background:
                    "linear-gradient(45deg, #2196F3 0%, #21CBF3 100%)",
                  mb: 3,
                }}
              >
                <Security sx={{ fontSize: 40, color: "white" }} />
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

              {/* <Typography variant="body1" color="text.secondary">
                Sign in to your AccessGate admin dashboard
              </Typography> */}
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
                // endIcon={!isLoading && <Login />}
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
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Signing In...
                  </>
                ) : (
                  "Sign In to Dashboard"
                )}
              </Button>

              {/* Divider and Sign in Link */}
              <Divider sx={{ my: 3 }}>
                <Box sx={{ display: "flex", flexDirection: "row", alignItems:'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Don't have an account?
                  </Typography>

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
              </Divider>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}