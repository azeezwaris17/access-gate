// app/gate/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store";
import { withAuth } from "@/lib/hocs/withAuth";
import api from "@/lib/services/api";

// Material UI Components
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Link,
  InputAdornment,
  IconButton,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";

// Material UI Icons
import {
  QrCodeScanner,
  CheckCircle,
  Event,
  Person,
  Email,
  ConfirmationNumber,
  Refresh,
  Search,
} from "@mui/icons-material";

/**
 * Event Selection Schema
 */
const eventSelectionSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
});

type EventSelectionForm = z.infer<typeof eventSelectionSchema>;

/**
 * Ticket Validation Schema
 */
const ticketValidationSchema = z.object({
  ticketCode: z
    .string()
    .min(1, "Ticket code is required")
    .regex(/^[A-Z0-9-]+$/, "Invalid ticket code format"),
});

type TicketValidationForm = z.infer<typeof ticketValidationSchema>;

/**
 * Interfaces
 */
interface ValidationResult {
  status: "success" | "error" | "idle";
  ticket?: {
    id: string;
    ticketCode: string;
    attendeeName: string;
    attendeeEmail: string;
    status: string;
    event: {
      id: string;
      name: string;
      date: string;
      venue: string;
      ticketTypes: Array<{
        name: string;
        price: number;
      }>;
    };
  };
  error?: string;
}

interface EventDetails {
  id: string;
  name: string;
  date: string;
  venue: string;
  description: string;
  totalTickets: number;
  checkedInTickets: number;
  ticketTypes: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
}

interface EventOption {
  id: string;
  name: string;
  date: string;
  status: "active" | "upcoming" | "completed";
}

type Step = "event-selection" | "ticket-validation" | "success";

function GateValidationPage() {
  const router = useRouter();
  const { admin, updateActivity } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<Step>("event-selection");
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    status: "idle",
  });
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [availableEvents, setAvailableEvents] = useState<EventOption[]>([]);

  /**
   * Fetch available events on component mount
   */
  useEffect(() => {
    fetchAvailableEvents();
  }, []);

  /**
   * Forms
   */
  const {
    register: registerEvent,
    handleSubmit: handleEventSubmit,
    formState: { errors: eventErrors },
    reset: resetEventForm,
  } = useForm<EventSelectionForm>({
    resolver: zodResolver(eventSelectionSchema),
  });

  const {
    register: registerTicket,
    handleSubmit: handleTicketSubmit,
    formState: { errors: ticketErrors },
    reset: resetTicketForm,
  } = useForm<TicketValidationForm>({
    resolver: zodResolver(ticketValidationSchema),
  });

  /**
   * Fetch available events for the admin
   */
  const fetchAvailableEvents = async () => {
    try {
      const response = await api.get("/events/available");
      setAvailableEvents(response.data.events || []);
    } catch (error: any) {
      console.error("Failed to fetch events:", error);
      if (error.response?.status !== 401) {
        toast.error("Failed to load available events");
      }
    }
  };

  /**
   * Handle event selection
   */
  const onEventSelect = async (data: EventSelectionForm) => {
    setIsLoading(true);
    updateActivity();

    try {
      const response = await api.get(`/events/${data.eventId}`);
      
      if (response.data) {
        setEventDetails(response.data);
        setCurrentStep("ticket-validation");
        toast.success(`Event "${response.data.name}" loaded successfully`);
      } else {
        toast.error("Event not found");
      }
    } catch (error: any) {
      console.error("Event fetch error:", error);
      if (error.response?.status !== 401) {
        toast.error(
          error.response?.data?.error || "Failed to load event details"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle ticket validation
   */
  const onTicketValidate = async (data: TicketValidationForm) => {
    setIsLoading(true);
    updateActivity();
    setValidationResult({ status: "idle" });

    try {
      const response = await api.post("/tickets/validate", {
        ticketCode: data.ticketCode.trim().toUpperCase(),
        eventId: eventDetails?.id,
        validatedBy: admin?.id,
      });

      setValidationResult({
        status: "success",
        ticket: response.data.ticket,
      });

      setCurrentStep("success");
      toast.success(`Ticket validated for ${response.data.ticket.attendeeName}`);

      // Auto-reset after 3 seconds for next scan
      setTimeout(() => {
        resetTicketForm();
        setValidationResult({ status: "idle" });
        setCurrentStep("ticket-validation");
      }, 3000);
    } catch (error: any) {
      console.error("Ticket validation error:", error);
      if (error.response?.status !== 401) {
        const errorMessage =
          error.response?.data?.error || "Ticket validation failed";

        setValidationResult({
          status: "error",
          error: errorMessage,
        });

        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset to scan next ticket
   */
  const handleScanNext = () => {
    resetTicketForm();
    setValidationResult({ status: "idle" });
    setCurrentStep("ticket-validation");
  };

  /**
   * Go back to event selection
   */
  const handleBackToEvent = () => {
    setCurrentStep("event-selection");
    setEventDetails(null);
    setValidationResult({ status: "idle" });
    resetEventForm();
    resetTicketForm();
  };

  /**
   * Format event name for display
   */
  const formatEventName = (event: EventOption) => {
    const date = new Date(event.date).toLocaleDateString();
    return `${event.name} (${date})`;
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
        {/* STEP 1: EVENT SELECTION */}
        {currentStep === "event-selection" && (
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
                  <Event sx={{ fontSize: 40, color: "white" }} />
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
                  Select Event
                </Typography>

                <Typography variant="body1" color="text.secondary">
                  Choose an event to begin ticket validation
                </Typography>
              </Box>

              {/* Event Selection Form */}
              <Box
                component="form"
                onSubmit={handleEventSubmit(onEventSelect)}
                noValidate
                sx={{ mt: 1 }}
              >
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Select Event</InputLabel>
                  <Select
                    {...registerEvent("eventId")}
                    label="Select Event"
                    error={!!eventErrors.eventId}
                    defaultValue=""
                  >
                    {availableEvents.map((event) => (
                      <MenuItem key={event.id} value={event.id}>
                        {formatEventName(event)}
                      </MenuItem>
                    ))}
                  </Select>
                  {eventErrors.eventId && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                      {eventErrors.eventId.message}
                    </Typography>
                  )}
                </FormControl>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading || availableEvents.length === 0}
                  endIcon={!isLoading && <Search />}
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
                      Loading Event...
                    </>
                  ) : (
                    "Select Event"
                  )}
                </Button>

                {availableEvents.length === 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No active events available. Please create events first.
                  </Alert>
                )}
              </Box>

              {/* Admin Info */}
              <Box sx={{ textAlign: "center", mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Signed in as: {admin?.fullName}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: TICKET VALIDATION */}
        {currentStep === "ticket-validation" && eventDetails && (
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
                      "linear-gradient(45deg, #4CAF50 0%, #8BC34A 100%)",
                    mb: 3,
                  }}
                >
                  <QrCodeScanner sx={{ fontSize: 40, color: "white" }} />
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
                  Validate Ticket
                </Typography>

                <Typography variant="body1" color="text.secondary">
                  Scan or enter ticket code for {eventDetails.name}
                </Typography>
              </Box>

              {/* Error Alert */}
              {validationResult.status === "error" && (
                <Alert
                  severity="error"
                  sx={{ mb: 3 }}
                  action={
                    <IconButton
                      onClick={handleScanNext}
                      color="inherit"
                      size="small"
                    >
                      <Refresh />
                    </IconButton>
                  }
                >
                  {validationResult.error}
                </Alert>
              )}

              {/* Ticket Validation Form */}
              <Box
                component="form"
                onSubmit={handleTicketSubmit(onTicketValidate)}
                noValidate
                sx={{ mt: 1 }}
              >
                <TextField
                  {...registerTicket("ticketCode")}
                  margin="normal"
                  required
                  fullWidth
                  name="ticketCode"
                  label="Ticket Code"
                  type="text"
                  id="ticketCode"
                  autoComplete="off"
                  autoFocus
                  error={!!ticketErrors.ticketCode}
                  helperText={
                    ticketErrors.ticketCode?.message ||
                    "Scan or enter ticket barcode"
                  }
                  placeholder="Enter ticket code or scan barcode..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <QrCodeScanner color={ticketErrors.ticketCode ? "error" : "action"} />
                      </InputAdornment>
                    ),
                    sx: {
                      textTransform: "uppercase",
                      fontFamily: "monospace",
                      letterSpacing: 1,
                    },
                  }}
                  sx={{ mb: 3 }}
                  disabled={isLoading}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  endIcon={!isLoading && <QrCodeScanner />}
                  sx={{
                    mt: 1,
                    mb: 2,
                    py: 1.5,
                    background:
                      "linear-gradient(45deg, #4CAF50 0%, #8BC34A 100%)",
                    "&:hover": {
                      background:
                        "linear-gradient(45deg, #388E3C 0%, #689F38 100%)",
                      transform: "translateY(-1px)",
                      boxShadow: 4,
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  {isLoading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Validating...
                    </>
                  ) : (
                    "Validate Ticket"
                  )}
                </Button>

                <Box sx={{ textAlign: "center", mt: 2 }}>
                  <Link
                    href="#"
                    onClick={handleBackToEvent}
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
                    ← Back to Event Selection
                  </Link>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: SUCCESS CONFIRMATION */}
        {currentStep === "success" && validationResult.ticket && (
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
                      "linear-gradient(45deg, #4CAF50 0%, #8BC34A 100%)",
                    mb: 3,
                  }}
                >
                  <CheckCircle sx={{ fontSize: 40, color: "white" }} />
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
                  Access Granted
                </Typography>

                <Typography variant="body1" color="text.secondary">
                  Ticket validated successfully
                </Typography>
              </Box>

              {/* Attendee Details */}
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 2,
                  background: "rgba(76, 175, 80, 0.05)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Person sx={{ mr: 2, color: "success.main" }} />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {validationResult.ticket.attendeeName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Attendee
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Email sx={{ mr: 2, color: "success.main" }} />
                  <Box>
                    <Typography variant="body1">
                      {validationResult.ticket.attendeeEmail}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <ConfirmationNumber sx={{ mr: 2, color: "success.main" }} />
                  <Box>
                    <Typography variant="body1">
                      {validationResult.ticket.event?.ticketTypes?.[0]?.name ||
                        "General Admission"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ticket Type
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Button
                onClick={handleScanNext}
                fullWidth
                variant="contained"
                size="large"
                endIcon={<Refresh />}
                sx={{
                  mt: 1,
                  mb: 2,
                  py: 1.5,
                  background:
                    "linear-gradient(45deg, #4CAF50 0%, #8BC34A 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(45deg, #388E3C 0%, #689F38 100%)",
                    transform: "translateY(-1px)",
                    boxShadow: 4,
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                Scan Next Ticket
              </Button>

              <Box sx={{ textAlign: "center", mt: 2 }}>
                <Link
                  href="#"
                  onClick={handleBackToEvent}
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
                  ← Back to Event Selection
                </Link>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Validating as: {admin?.fullName}
          </Typography>
          <Link
            href="/dashboard"
            variant="body2"
            sx={{
              textDecoration: "none",
              color: "primary.main",
              "&:hover": {
                color: "primary.dark",
              },
            }}
          >
            ← Back to Dashboard
          </Link>
        </Box>
      </Box>
    </Container>
  );
}

// Export the authenticated component
export default withAuth(GateValidationPage);