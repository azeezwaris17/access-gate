"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";
import api from "@/lib/services/api";
import { withAuth } from "@/lib/hocs/withAuth";

// Material UI Components
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  IconButton,
  CircularProgress,
  Paper,
  Avatar,
  useTheme,
  Divider,
  Alert,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  FormHelperText,
} from "@mui/material";

// Material UI Icons
import {
  ConfirmationNumber,
  AttachMoney,
  Numbers,
  Description,
  Add,
  Delete,
  ArrowBack,
  ArrowForward,
  Check,
  Error as ErrorIcon,
} from "@mui/icons-material";

/**
 * Individual ticket type schema
 */
const ticketSchema = z.object({
  name: z.string().min(1, "Ticket name is required"),
  price: z.number().min(0, "Price must be 0 or greater"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  specialConditions: z.string().optional(),
});

/**
 * Main form schema for multiple ticket types
 */
const createTicketsSchema = z.object({
  ticketTypes: z
    .array(ticketSchema)
    .min(1, "At least one ticket type is required"),
});

type CreateTicketsForm = z.infer<typeof createTicketsSchema>;

/**
 * Create Tickets Page Component
 * Handles creation of multiple ticket types for an event
 */
function CreateTicketsPage() {
  const { eventId } = useParams();
  const router = useRouter();
  const theme = useTheme();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /**
   * React Hook Form configuration with Zod validation
   */
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateTicketsForm>({
    resolver: zodResolver(createTicketsSchema),
    mode: "onChange",
    defaultValues: {
      ticketTypes: [
        { name: "", price: 0, quantity: 100, specialConditions: "" },
      ],
    },
  });

  /**
   * Field array for dynamic ticket type management
   */
  const { fields, append, remove } = useFieldArray({
    control,
    name: "ticketTypes",
  });

  // Watch form values for real-time validation
  const watchedValues = watch();

  /**
   * Handle form submission
   * Creates ticket types for the event using the API service
   */
  const onSubmit = async (data: CreateTicketsForm) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await api.post(
        `/events/${eventId}/ticket-types`,
        data.ticketTypes
      );

      if (response.data) {
        toast.success("Ticket types created successfully!");
        router.push("/dashboard");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Failed to create tickets";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Add a new ticket type field
   */
  const handleAddTicketType = () => {
    append({ name: "", price: 0, quantity: 100, specialConditions: "" });
  };

  /**
   * Steps for the creation process
   */
  const steps = ["Event Details", "Ticket Types"];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)",
        py: 4,
        px: { xs: 2, sm: 3, lg: 4 },
      }}
    >
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mx: "auto",
              mb: 3,
              background: "linear-gradient(45deg, #4CAF50 0%, #8BC34A 100%)",
            }}
          >
            <ConfirmationNumber sx={{ fontSize: 40 }} />
          </Avatar>

          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            fontWeight="bold"
          >
            Create Ticket Types
          </Typography>

          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 500, mx: "auto" }}
          >
            Set up different ticket options for your event
          </Typography>
        </Box>

        {/* Progress Stepper */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            background: "white",
          }}
        >
          <Stepper activeStep={1} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  StepIconComponent={() => (
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: index <= 1 ? "success.main" : "grey.300",
                        color: "white",
                        fontSize: "0.875rem",
                        fontWeight: "bold",
                      }}
                    >
                      {index === 0 ? <Check /> : "2"}
                    </Avatar>
                  )}
                >
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    color={index <= 1 ? "success.main" : "text.secondary"}
                  >
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Main Form Card */}
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

            {/* Ticket Types Form */}
            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              sx={{ mt: 1 }}
            >
              {/* Ticket Types List */}
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 3, mb: 4 }}
              >
                {fields.map((field, index) => (
                  <Paper
                    key={field.id}
                    elevation={2}
                    sx={{
                      p: 4,
                      borderRadius: 3,
                      border: "2px dashed",
                      borderColor: "grey.300",
                      backgroundColor: "grey.50",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: "grey.100",
                        borderColor: "success.light",
                      },
                    }}
                  >
                    {/* Ticket Type Header */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 3,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <ConfirmationNumber sx={{ color: "success.main" }} />
                        <Typography
                          variant="h6"
                          component="h3"
                          fontWeight="medium"
                        >
                          Ticket Type {index + 1}
                        </Typography>
                      </Box>

                      {fields.length > 1 && (
                        <IconButton
                          onClick={() => remove(index)}
                          sx={{
                            color: "error.main",
                            "&:hover": {
                              backgroundColor: "error.light",
                              color: "error.dark",
                            },
                          }}
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </Box>

                    {/* Ticket Type Fields */}
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 3 }}
                    >
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                        {/* Ticket Name */}
                        <TextField
                          {...register(`ticketTypes.${index}.name`)}
                          fullWidth
                          label="Ticket Name"
                          variant="outlined"
                          error={!!errors.ticketTypes?.[index]?.name}
                          helperText={
                            errors.ticketTypes?.[index]?.name?.message
                          }
                          placeholder="e.g., General Admission, VIP"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Description
                                  color={
                                    errors.ticketTypes?.[index]?.name
                                      ? "error"
                                      : "action"
                                  }
                                />
                              </InputAdornment>
                            ),
                          }}
                          sx={{ flex: "1 1 300px" }}
                        />

                        {/* Price */}
                        <TextField
                          {...register(`ticketTypes.${index}.price`, {
                            valueAsNumber: true,
                          })}
                          fullWidth
                          label="Price ($)"
                          type="number"
                          variant="outlined"
                          error={!!errors.ticketTypes?.[index]?.price}
                          helperText={
                            errors.ticketTypes?.[index]?.price?.message
                          }
                          placeholder="0.00"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <AttachMoney
                                  color={
                                    errors.ticketTypes?.[index]?.price
                                      ? "error"
                                      : "action"
                                  }
                                />
                              </InputAdornment>
                            ),
                            inputProps: {
                              step: "0.01",
                              min: "0",
                            },
                          }}
                          sx={{ flex: "1 1 200px" }}
                        />

                        {/* Quantity */}
                        <TextField
                          {...register(`ticketTypes.${index}.quantity`, {
                            valueAsNumber: true,
                          })}
                          fullWidth
                          label="Quantity"
                          type="number"
                          variant="outlined"
                          error={!!errors.ticketTypes?.[index]?.quantity}
                          helperText={
                            errors.ticketTypes?.[index]?.quantity?.message
                          }
                          placeholder="e.g., 100"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Numbers
                                  color={
                                    errors.ticketTypes?.[index]?.quantity
                                      ? "error"
                                      : "action"
                                  }
                                />
                              </InputAdornment>
                            ),
                            inputProps: {
                              min: "1",
                            },
                          }}
                          sx={{ flex: "1 1 200px" }}
                        />
                      </Box>

                      {/* Special Conditions */}
                      <TextField
                        {...register(`ticketTypes.${index}.specialConditions`)}
                        fullWidth
                        label="Special Conditions (Optional)"
                        variant="outlined"
                        multiline
                        rows={3}
                        placeholder="e.g., 21+ only, includes one free drink, non-refundable"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment
                              position="start"
                              sx={{ alignSelf: "flex-start", mt: 1 }}
                            >
                              <Description color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                  </Paper>
                ))}
              </Box>

              {/* Add Another Ticket Type Button */}
              <Button
                type="button"
                fullWidth
                variant="outlined"
                startIcon={<Add />}
                onClick={handleAddTicketType}
                sx={{
                  py: 2,
                  border: "2px dashed",
                  borderColor: "success.main",
                  color: "success.main",
                  "&:hover": {
                    backgroundColor: "success.light",
                    borderColor: "success.dark",
                    borderStyle: "solid",
                  },
                  borderRadius: 2,
                  mb: 4,
                }}
              >
                Add Another Ticket Type
              </Button>

              {/* Navigation Buttons */}
              <Box
                sx={{
                  display: "flex",
                  gap: 3,
                  flexDirection: { xs: "column", sm: "row" },
                }}
              >
                <Button
                  type="button"
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<ArrowBack />}
                  onClick={() => router.back()}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                  }}
                >
                  Back
                </Button>

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
                      "linear-gradient(45deg, #4CAF50 0%, #8BC34A 100%)",
                    "&:hover": {
                      background:
                        "linear-gradient(45deg, #388E3C 0%, #689F38 100%)",
                      transform: "translateY(-1px)",
                      boxShadow: 4,
                    },
                    transition: "all 0.2s ease-in-out",
                    borderRadius: 2,
                  }}
                >
                  {isLoading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Creating Tickets...
                    </>
                  ) : (
                    "Complete Event Setup"
                  )}
                </Button>
              </Box>
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
              You can always edit these ticket types later from your event
              dashboard
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
              {errors.ticketTypes && (
                <Typography component="li" variant="body2" color="warning.dark">
                  {typeof errors.ticketTypes === "object" &&
                  errors.ticketTypes !== null &&
                  "message" in errors.ticketTypes
                    ? (errors.ticketTypes as any).message
                    : "Ticket type errors exist"}
                </Typography>
              )}
              {fields.map((_, index) => {
                const ticketErrors = errors.ticketTypes?.[index];
                if (!ticketErrors) return null;

                const errorMessages = Object.values(ticketErrors)
                  .map((err: any) => err?.message)
                  .filter(Boolean)
                  .join(", ");

                return (
                  <Typography
                    key={index}
                    component="li"
                    variant="body2"
                    color="warning.dark"
                  >
                    Ticket {index + 1}: {errorMessages}
                  </Typography>
                );
              })}
            </Box>
          </Paper>
        )}
      </Container>
    </Box>
  );
}

export default withAuth(CreateTicketsPage);