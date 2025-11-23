"use client";

import React, { useState, useEffect } from "react";
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
 * Schemas
 */
const eventSelectionSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
});

const ticketValidationSchema = z.object({
  ticketCode: z
    .string()
    .min(1, "Ticket code is required")
    .regex(/^[A-Z0-9-]+$/, "Invalid ticket code format"),
});

/**
 * Type Definitions
 */
type EventSelectionForm = z.infer<typeof eventSelectionSchema>;
type TicketValidationForm = z.infer<typeof ticketValidationSchema>;
type Step = "event-selection" | "ticket-validation" | "success";
type ValidationStatus = "success" | "error" | "idle";

interface ValidationResult {
  status: ValidationStatus;
  ticket?: {
    id: string;
    ticketCode: string;
    attendeeName: string;
    attendeeEmail: string;
    status: string;
    checkedInAt?: Date;
    event: {
      id: string;
      name: string;
      date: Date;
      time: string;
      location: string;
    };
    ticketType: string;
    price: number;
  };
  error?: string;
  message?: string;
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

interface ApiEventResponse {
  _id?: string;
  id?: string;
  name: string;
  date: string;
  computedStatus?: string;
  status?: string;
}

interface ApiEventsResponse {
  success?: boolean;
  events?: ApiEventResponse[];
  data?: ApiEventResponse[];
}

interface ApiError {
  response?: {
    status: number;
    data?: { error?: string };
  };
}

/**
 * Header Icon Component
 */
interface HeaderIconProps {
  icon: React.ReactNode;
  gradient: string;
}

const HeaderIcon: React.FC<HeaderIconProps> = ({ icon, gradient }) => (
  <Paper
    elevation={4}
    sx={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 80,
      height: 80,
      borderRadius: 2,
      background: gradient,
      mb: 3,
    }}
  >
    {icon}
  </Paper>
);

/**
 * Page Header Component
 */
interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  gradient,
}) => (
  <Box sx={{ textAlign: "center", mb: 4 }}>
    <HeaderIcon icon={icon} gradient={gradient} />
    <Typography
      variant="h4"
      component="h1"
      gutterBottom
      sx={{
        fontWeight: "bold",
        color: "text.primary",
      }}
    >
      {title}
    </Typography>
    <Typography variant="body1" color="text.secondary">
      {subtitle}
    </Typography>
  </Box>
);

/**
 * Footer Component
 */
const Footer: React.FC = () => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        mt: 3,
      }}
    >
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
        Go to Dashboard
      </Link>
    </Box>
  );
};

/**
 * Event Selection Step Component
 */
interface EventSelectionStepProps {
  onEventSelect: (data: EventSelectionForm) => void;
  availableEvents: EventOption[];
  isLoading: boolean;
}

const EventSelectionStep: React.FC<EventSelectionStepProps> = ({
  onEventSelect,
  availableEvents,
  isLoading,
}) => {
  const {
    register: registerEvent,
    handleSubmit: handleEventSubmit,
    formState: { errors: eventErrors },
  } = useForm<EventSelectionForm>({
    resolver: zodResolver(eventSelectionSchema),
  });

  const formatEventName = (event: EventOption) => {
    const date = new Date(event.date).toLocaleDateString();
    return `${event.name} (${date})`;
  };

  return (
    <Card
      elevation={8}
      sx={{ borderRadius: 3, overflow: "hidden", background: "white" }}
    >
      <CardContent sx={{ p: 4 }}>
        <PageHeader
          title="Select Event"
          subtitle="Choose an event to begin ticket validation"
          icon={<Event sx={{ fontSize: 40, color: "white" }} />}
          gradient="linear-gradient(45deg, #2196F3 0%, #21CBF3 100%)"
        />

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
              <Typography
                variant="caption"
                color="error"
                sx={{ mt: 1, display: "block" }}
              >
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
              background: "linear-gradient(45deg, #2196F3 0%, #21CBF3 100%)",
              "&:hover": {
                background: "linear-gradient(45deg, #1976D2 0%, #00ACC1 100%)",
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
              "Search"
            )}
          </Button>

          {availableEvents.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No active events available. Please create events first.
            </Alert>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Ticket Validation Step Component
 */
interface TicketValidationStepProps {
  eventDetails: EventDetails;
  validationResult: ValidationResult;
  onTicketValidate: (data: TicketValidationForm) => void;
  onBackToEvent: () => void;
  onScanNext: () => void;
  isLoading: boolean;
}

const TicketValidationStep: React.FC<TicketValidationStepProps> = ({
  eventDetails,
  validationResult,
  onTicketValidate,
  onBackToEvent,
  onScanNext,
  isLoading,
}) => {
  const {
    register: registerTicket,
    handleSubmit: handleTicketSubmit,
    formState: { errors: ticketErrors },
    reset: resetTicketForm,
  } = useForm<TicketValidationForm>({
    resolver: zodResolver(ticketValidationSchema),
  });

  // Reset form when scanning next
  React.useEffect(() => {
    if (validationResult.status === "idle") {
      resetTicketForm();
    }
  }, [validationResult.status, resetTicketForm]);

  return (
    <Card
      elevation={8}
      sx={{ borderRadius: 3, overflow: "hidden", background: "white" }}
    >
      <CardContent sx={{ p: 4 }}>
        <PageHeader
          title="Validate Ticket"
          subtitle={`Enter your ticket code for ${eventDetails.name}`}
          icon={<QrCodeScanner sx={{ fontSize: 40, color: "white" }} />}
          gradient="linear-gradient(45deg, #4CAF50 0%, #8BC34A 100%)"
        />

        {validationResult.status === "error" && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={
              <IconButton onClick={onScanNext} color="inherit" size="small">
                <Refresh />
              </IconButton>
            }
          >
            {validationResult.error}
          </Alert>
        )}

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
            helperText={ticketErrors.ticketCode?.message || "Enter ticket code"}
            placeholder="Enter ticket code ..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <QrCodeScanner
                    color={ticketErrors.ticketCode ? "error" : "action"}
                  />
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
              background: "linear-gradient(45deg, #4CAF50 0%, #8BC34A 100%)",
              "&:hover": {
                background: "linear-gradient(45deg, #388E3C 0%, #689F38 100%)",
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
        </Box>
      </CardContent>
      <CardContent>
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Link
            href="#"
            onClick={onBackToEvent}
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
  );
};

/**
 * Success Step Component
 */
interface SuccessStepProps {
  validationResult: ValidationResult;
  onScanNext: () => void;
  onBackToEvent: () => void;
}

const SuccessStep: React.FC<SuccessStepProps> = ({
  validationResult,
  onScanNext,
  onBackToEvent,
}) => {
  const { ticket } = validationResult;

  if (!ticket) return null;

  return (
    <Card
      elevation={8}
      sx={{ borderRadius: 3, overflow: "hidden", background: "white" }}
    >
      <CardContent sx={{ p: 4 }}>
        <PageHeader
          title="Access Granted"
          subtitle="Ticket validated successfully"
          icon={<CheckCircle sx={{ fontSize: 40, color: "white" }} />}
          gradient="linear-gradient(45deg, #4CAF50 0%, #8BC34A 100%)"
        />

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
                {ticket.attendeeName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Attendee
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Email sx={{ mr: 2, color: "success.main" }} />
            <Box>
              <Typography variant="body1">{ticket.attendeeEmail}</Typography>
              <Typography variant="body2" color="text.secondary">
                Email
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <ConfirmationNumber sx={{ mr: 2, color: "success.main" }} />
            <Box>
              <Typography variant="body1">
                {ticket.ticketType}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ticket Type
              </Typography>
            </Box>
          </Box>

          {ticket.checkedInAt && (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CheckCircle sx={{ mr: 2, color: "success.main" }} />
              <Box>
                <Typography variant="body1">
                  Checked in at {new Date(ticket.checkedInAt).toLocaleTimeString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Check-in Time
                </Typography>
              </Box>
            </Box>
          )}
        </Paper>

        <Button
          onClick={onScanNext}
          fullWidth
          variant="contained"
          size="large"
          endIcon={<Refresh />}
          sx={{
            mt: 1,
            mb: 2,
            py: 1.5,
            background: "linear-gradient(45deg, #4CAF50 0%, #8BC34A 100%)",
            "&:hover": {
              background: "linear-gradient(45deg, #388E3C 0%, #689F38 100%)",
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
            onClick={onBackToEvent}
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
  );
};

/**
 * Main Gate Validation Page Component
 */
function GateValidationPage() {
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

  const fetchAvailableEvents = async () => {
    try {
      setIsLoading(true);
      // Use the main events endpoint with status=active filter
      const response = await api.get<ApiEventsResponse | ApiEventResponse[]>("/v1/events?status=active&limit=100");

      console.log("API Response:", response.data); // Debug log

      // Extract events from the response with proper typing
      let eventsData: ApiEventResponse[] | undefined;

      if (Array.isArray(response.data)) {
        // If response.data is directly an array
        eventsData = response.data;
      } else if (response.data && 'events' in response.data && Array.isArray(response.data.events)) {
        // If response.data has an events property that is an array
        eventsData = response.data.events;
      } else if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
        // If response.data has a data property that is an array
        eventsData = response.data.data;
      } else if (response.data && 'success' in response.data) {
        // If it's a success response but no events array found
        eventsData = [];
      }

      if (Array.isArray(eventsData)) {
        const events: EventOption[] = eventsData.map((event: ApiEventResponse) => ({
          id: event._id || event.id || '',
          name: event.name || 'Unnamed Event',
          date: event.date || new Date().toISOString(),
          status: (event.computedStatus || event.status || "active") as "active" | "upcoming" | "completed",
        })).filter(event => event.id && event.name); // Filter out invalid events

        setAvailableEvents(events);
        console.log(`✅ Loaded ${events.length} events from API`);
      } else {
        setAvailableEvents([]);
        console.warn("No events data found in response:", response.data);
      }
    } catch (error: unknown) {
      console.error("Failed to fetch events:", error);

      const apiError = error as ApiError;
      if (apiError.response?.status !== 401) {
        toast.error("Failed to load available events");
      }
      setAvailableEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle event selection
   */
  const onEventSelect = async (data: EventSelectionForm) => {
    setIsLoading(true);
    updateActivity();

    try {
      const selectedEvent = availableEvents.find(
        (event) => event.id === data.eventId
      );

      if (selectedEvent) {
        const eventDetails: EventDetails = {
          id: selectedEvent.id,
          name: selectedEvent.name,
          date: selectedEvent.date,
          venue: "Event Venue",
          description: "Event Description",
          totalTickets: 0,
          checkedInTickets: 0,
          ticketTypes: [],
        };

        setEventDetails(eventDetails);
        setCurrentStep("ticket-validation");
        toast.success(`Event "${selectedEvent.name}" loaded successfully`);
      } else {
        toast.error("Event not found");
      }
    } catch (error: unknown) {
      console.error("Event fetch error:", error);

      const apiError = error as ApiError;
      if (apiError.response?.status !== 401) {
        toast.error(
          apiError.response?.data?.error || "Failed to load event details"
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
      const response = await api.post("/v1/tickets/check-in", {
        ticketCode: data.ticketCode.trim().toUpperCase(),
        eventId: eventDetails?.id,
        validatedBy: admin?.id,
      });

      if (response.data.success) {
        setValidationResult({
          status: "success",
          ticket: response.data.ticket,
          message: response.data.message,
        });

        setCurrentStep("success");
        toast.success(response.data.message || `Checked in ${response.data.ticket.attendeeName} successfully!`);

        // Auto-return to validation after 5 seconds
        setTimeout(() => {
          setValidationResult({ status: "idle" });
          setCurrentStep("ticket-validation");
        }, 5000);
      } else {
        throw new Error(response.data.error || "Check-in failed");
      }
    } catch (error: unknown) {
      console.error("Ticket validation error:", error);

      const apiError = error as ApiError;
      if (apiError.response?.status !== 401) {
        const errorMessage = apiError.response?.data?.error || "Ticket validation failed";

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
  };

  /**
   * Render current step
   */
  const renderCurrentStep = () => {
    switch (currentStep) {
      case "event-selection":
        return (
          <>
            <EventSelectionStep
              onEventSelect={onEventSelect}
              availableEvents={availableEvents}
              isLoading={isLoading}
            />

            <Footer />
          </>
        );

      case "ticket-validation":
        return eventDetails ? (
          <TicketValidationStep
            eventDetails={eventDetails}
            validationResult={validationResult}
            onTicketValidate={onTicketValidate}
            onBackToEvent={handleBackToEvent}
            onScanNext={handleScanNext}
            isLoading={isLoading}
          />
        ) : null;

      case "success":
        return (
          <SuccessStep
            validationResult={validationResult}
            onScanNext={handleScanNext}
            onBackToEvent={handleBackToEvent}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Container
      component="main"
      maxWidth="sm"
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      }}
    >
      <Box
        sx={{
          alignSelf: "flex-end",
          textAlign: "center",
          mt: 2,
          mb: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Signed in as: {admin?.fullName}
        </Typography>
      </Box>

      <Box sx={{ width: "100%" }}>
        {renderCurrentStep()}
      </Box>
    </Container>
  );
}

// Export the authenticated component
export default withAuth(GateValidationPage);