// app/dashboard/events/create-event/page.tsx
"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/services/api";
import { withAuth } from "@/lib/hocs/withAuth";

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
  InputAdornment,
  IconButton,
} from "@mui/material";

// Material UI Icons
import {
  Event,
  Schedule,
  LocationOn,
  Description,
  ArrowForward,
  Error as ErrorIcon,
  CalendarToday,
  Add,
  Delete,
  ConfirmationNumber,
  AttachMoney,
} from "@mui/icons-material";

/**
 * Zod schema for form validation
 */
const ticketTypeSchema = z.object({
  name: z.string().min(1, "Ticket type name is required"),
  price: z.number().min(0, "Price must be positive"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  description: z.string().optional(),
  specialConditions: z.string().optional(),
});

const createEventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  date: z.string().min(1, "Event date is required"),
  time: z.string().min(1, "Event time is required"),
  location: z.string().min(1, "Event location is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  ticketTypes: z
    .array(ticketTypeSchema)
    .min(1, "At least one ticket type is required"),
});

type CreateEventForm = z.infer<typeof createEventSchema>;
type TicketTypeForm = z.infer<typeof ticketTypeSchema>;

/**
 * Create Event Page Component
 */
function CreateEventPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  /**
   * React Hook Form configuration
   */
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    trigger,
  } = useForm<CreateEventForm>({
    resolver: zodResolver(createEventSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      date: "",
      time: "",
      location: "",
      description: "",
      ticketTypes: [],
    },
  });

  /**
   * Add a new ticket type
   */
  const addTicketType = () => {
    const currentTicketTypes = getValues("ticketTypes");
    setValue("ticketTypes", [
      ...currentTicketTypes,
      {
        name: "",
        price: 0,
        quantity: 1,
        description: "",
        specialConditions: "",
      },
    ]);
  };

  /**
   * Remove a ticket type
   */
  const removeTicketType = (index: number) => {
    const currentTicketTypes = getValues("ticketTypes");
    setValue(
      "ticketTypes",
      currentTicketTypes.filter((_, i) => i !== index)
    );
  };

  /**
   * Update ticket type field
   */
  const updateTicketType = (
    index: number,
    field: keyof TicketTypeForm,
    value: string | number
  ) => {
    const currentTicketTypes = getValues("ticketTypes");
    const updatedTicketTypes = [...currentTicketTypes];
    updatedTicketTypes[index] = {
      ...updatedTicketTypes[index],
      [field]: value,
    };
    setValue("ticketTypes", updatedTicketTypes, { shouldValidate: true });
  };

  /**
   * Handle next step
   */
  const handleNextStep = async () => {
    // Validate current step fields with proper typing
    let isValid = false;

    if (activeStep === 0) {
      isValid = await trigger([
        "name",
        "date",
        "time",
        "location",
        "description",
      ] as const);
    } else {
      isValid = await trigger(["ticketTypes"] as const);
    }

    if (isValid) {
      setActiveStep((prev) => prev + 1);
    } else {
      toast.error("Please fix the validation errors before proceeding");
    }
  };

  /**
   * Handle form submission
   */
  const onSubmit = async (data: CreateEventForm) => {
    setIsLoading(true);
    setError("");

    try {
      // Format the date properly for the API
      const formattedData = {
        ...data,
        date: new Date(data.date).toISOString(),
        // Ensure ticket types have proper structure
        ticketTypes: data.ticketTypes.map((ticketType) => ({
          ...ticketType,
          // Ensure price and quantity are numbers
          price: Number(ticketType.price),
          quantity: Number(ticketType.quantity),
        })),
      };

      const response = await api.post("/v1/events/create-event", formattedData);

      if (response.data.success) {
        toast.success("Event created successfully!");
        router.push("/dashboard/events/all-events");
      } else {
        throw new Error(response.data.error || "Failed to create event");
      }
    } catch (err: unknown) {
      console.error("Event creation error:", err);
      let errorMessage = "Failed to create event";

      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosError = err as {
          response?: { status?: number; data?: { error?: string } };
        };
        errorMessage = axiosError.response?.data?.error || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Steps for the creation process
   */
  const steps = ["Event Details", "Ticket Types"];

  const ticketTypes = watch("ticketTypes") || [];

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
            Set up your event details and ticket types in one go.
          </Typography>
        </Box>

        {/* Progress Stepper */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 2,
            background: "white",
            mb: 3,
          }}
        >
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Form Card */}
        <Card
          elevation={4}
          sx={{
            borderRadius: 2,
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
              {activeStep === 0 && (
                <>
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

                  {/* Date and Time Fields - Flexbox Layout */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 3,
                      mb: 3,
                    }}
                  >
                    {/* Date Field */}
                    <Box sx={{ flex: 1 }}>
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
                    </Box>

                    {/* Time Field */}
                    <Box sx={{ flex: 1 }}>
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
                              <Schedule
                                color={errors.time ? "error" : "action"}
                              />
                            </InputAdornment>
                          ),
                        }}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Box>
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

                  <Button
                    onClick={handleNextStep}
                    fullWidth
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForward />}
                    sx={{
                      py: 1.5,
                      background:
                        "linear-gradient(45deg, #2196F3 0%, #21CBF3 100%)",
                    }}
                  >
                    Next: Add Ticket Types
                  </Button>
                </>
              )}

              {activeStep === 1 && (
                <>
                  {/* Ticket Types Section */}
                  <Box sx={{ mb: 4 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 3,
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold">
                        Ticket Types
                      </Typography>
                      <Button
                        startIcon={<Add />}
                        onClick={addTicketType}
                        variant="outlined"
                      >
                        Add Ticket Type
                      </Button>
                    </Box>

                    {ticketTypes.length === 0 && (
                      <Alert severity="info" sx={{ mb: 3 }}>
                        Add at least one ticket type for your event.
                      </Alert>
                    )}

                    {ticketTypes.map((_, index) => (
                      <Paper
                        key={index}
                        elevation={2}
                        sx={{ p: 3, mb: 3, borderRadius: 2 }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 2,
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <ConfirmationNumber />
                            Ticket Type {index + 1}
                          </Typography>
                          <IconButton
                            onClick={() => removeTicketType(index)}
                            color="error"
                            disabled={ticketTypes.length <= 1}
                          >
                            <Delete />
                          </IconButton>
                        </Box>

                        {/* Ticket Type Fields - Flexbox Layout */}
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            gap: 3,
                            mb: 3,
                          }}
                        >
                          {/* Ticket Name */}
                          <Box sx={{ flex: 1 }}>
                            <TextField
                              fullWidth
                              label="Ticket Name *"
                              value={ticketTypes[index]?.name || ""}
                              onChange={(e) =>
                                updateTicketType(index, "name", e.target.value)
                              }
                              error={!!errors.ticketTypes?.[index]?.name}
                              helperText={
                                errors.ticketTypes?.[index]?.name?.message
                              }
                              placeholder="e.g., General Admission, VIP"
                            />
                          </Box>

                          {/* Price */}
                          <Box sx={{ flex: 1 }}>
                            <TextField
                              fullWidth
                              label="Price *"
                              type="number"
                              value={ticketTypes[index]?.price || ""}
                              onChange={(e) =>
                                updateTicketType(
                                  index,
                                  "price",
                                  e.target.value === ""
                                    ? 0
                                    : parseFloat(e.target.value)
                                )
                              }
                              error={!!errors.ticketTypes?.[index]?.price}
                              helperText={
                                errors.ticketTypes?.[index]?.price?.message
                              }
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <AttachMoney />
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Box>

                          {/* Quantity */}
                          <Box sx={{ flex: 1 }}>
                            <TextField
                              fullWidth
                              label="Quantity *"
                              type="number"
                              value={ticketTypes[index]?.quantity || ""}
                              onChange={(e) =>
                                updateTicketType(
                                  index,
                                  "quantity",
                                  e.target.value === ""
                                    ? 1
                                    : parseInt(e.target.value)
                                )
                              }
                              error={!!errors.ticketTypes?.[index]?.quantity}
                              helperText={
                                errors.ticketTypes?.[index]?.quantity?.message
                              }
                            />
                          </Box>
                        </Box>

                        {/* Description Field */}
                        <Box sx={{ mb: 2 }}>
                          <TextField
                            fullWidth
                            label="Description (Optional)"
                            multiline
                            rows={2}
                            value={ticketTypes[index]?.description || ""}
                            onChange={(e) =>
                              updateTicketType(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                            placeholder="Describe this ticket type..."
                          />
                        </Box>

                        {/* Special Conditions Field */}
                        <Box>
                          <TextField
                            fullWidth
                            label="Special Conditions (Optional)"
                            multiline
                            rows={2}
                            value={ticketTypes[index]?.specialConditions || ""}
                            onChange={(e) =>
                              updateTicketType(
                                index,
                                "specialConditions",
                                e.target.value
                              )
                            }
                            placeholder="Any special terms or conditions for this ticket..."
                          />
                        </Box>
                      </Paper>
                    ))}
                  </Box>

                  {/* Navigation Buttons */}
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      onClick={() => setActiveStep(0)}
                      variant="outlined"
                      size="large"
                      sx={{ flex: 1 }}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={isLoading}
                      sx={{
                        flex: 2,
                        background:
                          "linear-gradient(45deg, #2196F3 0%, #21CBF3 100%)",
                      }}
                    >
                      {isLoading ? (
                        <>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Creating Event...
                        </>
                      ) : (
                        "Create Event"
                      )}
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default withAuth(CreateEventPage);
