"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";
import api from "@/lib/services/api"; // Import API service
import { withAuth } from "@/lib/hocs/withAuth"; // Import HOC

// Material UI Components
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Paper,
  Avatar,
  useTheme,
  InputAdornment,
  FormHelperText,
} from "@mui/material";

// Material UI Icons
import {
  Event,
  Schedule,
  LocationOn,
  Description,
  ArrowForward,
  Error as ErrorIcon,
  CheckCircle,
  CalendarToday,
} from "@mui/icons-material";

/**
 * Zod schema for form validation
 * Defines the shape and validation rules for the create event form
 */
const createEventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  date: z.string().min(1, "Event date is required"),
  time: z.string().min(1, "Event time is required"),
  location: z.string().min(1, "Event location is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type CreateEventForm = z.infer<typeof createEventSchema>;

/**
 * Create Event Page Component
 * Handles event creation with form validation and multi-step progression
 */
function CreateEventPage() {
  const router = useRouter();
  const { admin } = useAuthStore(); // We can access admin info if needed
  const theme = useTheme();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /**
   * React Hook Form configuration with Zod validation
   */
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateEventForm>({
    resolver: zodResolver(createEventSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      date: "",
      time: "",
      location: "",
      description: "",
    },
  });

  // Watch form values for real-time validation display
  const watchedValues = watch();

  /**
   * Handle form submission
   * Creates event and redirects to ticket creation page
   */
  const onSubmit = async (data: CreateEventForm) => {
    setIsLoading(true);
    setError("");

    try {
      // Use API service - automatically includes auth token
      const response = await api.post("/events/create-event", data); // Removed /api prefix

      if (response.data) {
        toast.success("Event created successfully!");

        // Extract eventId and redirect to ticket creation
        const eventId = response.data._id || response.data.id;
        router.push(`/dashboard/tickets/${eventId}/create-ticket`);
      }
    } catch (error: any) {
      // 401 errors are automatically handled by the API service interceptor
      const errorMessage =
        error.response?.data?.error || "Failed to create event";
      setError(errorMessage);
      
      // Only show toast if it's not a 401 error (already handled)
      if (error.response?.status !== 401) {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Steps for the creation process
   */
  const steps = ["Event Details", "Ticket Types"];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        py: 4,
        px: { xs: 2, sm: 3, lg: 4 },
      }}
    >
      <Container maxWidth="md">
        {/* Header Section */}
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mx: "auto",
              mb: 3,
              background: "linear-gradient(45deg, #2196F3 0%, #21CBF3 100%)",
            }}
          >
            <Event sx={{ fontSize: 40 }} />
          </Avatar>

          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            fontWeight="bold"
          >
            Create New Event
          </Typography>

          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 500, mx: "auto" }}
          >
            Start by setting up your event details. You'll add tickets in the
            next step.
          </Typography>
        </Box>

        {/* Progress Stepper */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            background: "white",
          }}
        >
          <Stepper activeStep={0} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel
                  StepIconComponent={() => (
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor:
                          label === "Event Details"
                            ? "primary.main"
                            : "grey.300",
                        color: "white",
                        fontSize: "0.875rem",
                        fontWeight: "bold",
                      }}
                    >
                      {label === "Event Details" ? "1" : "2"}
                    </Avatar>
                  )}
                >
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    color={
                      label === "Event Details"
                        ? "primary.main"
                        : "text.secondary"
                    }
                  >
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Form Card */}
        <Card
          elevation={4}
          sx={{
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            overflow: "hidden",
            background: "white",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} icon={<ErrorIcon />}>
                {error}
              </Alert>
            )}

            {/* Event Creation Form */}
            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              sx={{ mt: 1 }}
            >
              {/* Event Name Field */}
              <TextField
                {...register("name")}
                fullWidth
                label="Event Name"
                variant="outlined"
                error={!!errors.name}
                helperText={errors.name?.message}
                placeholder="Enter your event name"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Event color={errors.name ? "error" : "action"} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              {/* Date and Time Fields */}
              <Box
                sx={{
                  display: "flex",
                  gap: 3,
                  mb: 3,
                  flexWrap: { xs: "wrap", sm: "nowrap" },
                }}
              >
                {/* Date Field */}
                <TextField
                  {...register("date")}
                  fullWidth
                  label="Event Date"
                  type="date"
                  variant="outlined"
                  error={!!errors.date}
                  helperText={errors.date?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarToday
                          color={errors.date ? "error" : "action"}
                        />
                      </InputAdornment>
                    ),
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />

                {/* Time Field */}
                <TextField
                  {...register("time")}
                  fullWidth
                  label="Event Time"
                  type="time"
                  variant="outlined"
                  error={!!errors.time}
                  helperText={errors.time?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Schedule color={errors.time ? "error" : "action"} />
                      </InputAdornment>
                    ),
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Box>

              {/* Location Field */}
              <TextField
                {...register("location")}
                fullWidth
                label="Event Location"
                variant="outlined"
                error={!!errors.location}
                helperText={errors.location?.message}
                placeholder="Enter venue name or address"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn
                        color={errors.location ? "error" : "action"}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              {/* Description Field */}
              <TextField
                {...register("description")}
                fullWidth
                label="Event Description"
                variant="outlined"
                multiline
                rows={4}
                error={!!errors.description}
                helperText={
                  errors.description?.message ||
                  "Minimum 10 characters required"
                }
                placeholder="Describe your event in detail..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment
                      position="start"
                      sx={{ alignSelf: "flex-start", mt: 1 }}
                    >
                      <Description
                        color={errors.description ? "error" : "action"}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 4 }}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                endIcon={!isLoading && <ArrowForward />}
                sx={{
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
                    Creating Event...
                  </>
                ) : (
                  "Next: Add Ticket Types"
                )}
              </Button>
            </Box>
          </CardContent>

          {/* Footer Note */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: "grey.50",
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="body2" color="text.secondary" align="center">
              You'll be able to add multiple ticket types and pricing in the
              next step
            </Typography>
          </Paper>
        </Card>

        {/* Form Validation Summary */}
        {Object.keys(errors).length > 0 && (
          <Paper
            elevation={1}
            sx={{
              p: 2,
              mt: 3,
              borderRadius: 2,
              background: "warning.light",
            }}
          >
            <Typography
              variant="body2"
              color="warning.dark"
              fontWeight="medium"
            >
              Please fix the following errors to continue:
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
              {Object.entries(errors).map(([field, error]) => (
                <Typography
                  key={field}
                  component="li"
                  variant="body2"
                  color="warning.dark"
                >
                  {error.message}
                </Typography>
              ))}
            </Box>
          </Paper>
        )}
      </Container>
    </Box>
  );
}

// Export the authenticated component
export default withAuth(CreateEventPage);