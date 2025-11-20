// app/(public)/events/page.tsx
"use client";

import React from "react";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import api from "@/lib/services/api";
import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";

// Material UI Components
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Paper,
  InputAdornment,
  Avatar,
  Divider,
  Zoom,
  Slide,
  Grow,
  useTheme,
  alpha,
  IconButton,
  Skeleton,
  Chip,
} from "@mui/material";

// Material UI Icons
import {
  Event,
  LocationOn,
  CalendarToday,
  Search as SearchIcon,
  Person,
  Email,
  Download,
  QrCode,
  CheckCircle,
  LocalActivity,
  Close,
} from "@mui/icons-material";

// Types
interface Event {
  _id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  description: string;
  ticketTypes: Array<{
    _id: string;
    name: string;
    price: number;
    quantity: number; // Total tickets
    sold: number; // Number sold
    description?: string;
  }>;
}

interface TicketType {
  _id: string;
  name: string;
  price: number;
  quantity: number; // Total tickets
  sold: number; // Number sold
  description?: string;
}

interface PurchasedTicket {
  _id: string;
  ticketCode: string;
  attendeeName: string;
  attendeeEmail: string;
  status: string;
  event: {
    name: string;
    date: string;
    time: string;
    location: string;
  };
  ticketType: string;
  price: number;
}

// Zod Schema for form validation
const purchaseFormSchema = z.object({
  attendeeName: z.string().min(2, "Name must be at least 2 characters"),
  attendeeEmail: z.string().email("Please enter a valid email address"),
});

type PurchaseFormData = z.infer<typeof purchaseFormSchema>;

// Loading Skeleton Components
const LoadingScreen = () => (
  <Box
    sx={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      py: 4,
    }}
  >
    <Container maxWidth="xl">
      {/* Header Skeleton */}
      <Box sx={{ textAlign: "center", mb: 8 }}>
        <Skeleton
          variant="circular"
          width={80}
          height={80}
          sx={{ mx: "auto", mb: 3 }}
        />
        <Skeleton
          variant="text"
          width={300}
          height={60}
          sx={{ mx: "auto", mb: 2 }}
        />
        <Skeleton
          variant="text"
          width={400}
          height={30}
          sx={{ mx: "auto", mb: 3 }}
        />
        <Box sx={{ display: "flex", justifyContent: "center", gap: 4, mt: 3 }}>
          {[1, 2].map((item) => (
            <Box key={item} sx={{ textAlign: "center" }}>
              <Skeleton variant="text" width={60} height={40} />
              <Skeleton variant="text" width={80} height={20} />
            </Box>
          ))}
        </Box>
      </Box>

      {/* Search Bar Skeleton */}
      <Skeleton
        variant="rounded"
        width={600}
        height={80}
        sx={{ mx: "auto", mb: 6 }}
      />

      {/* Events Grid Skeleton */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 3,
          justifyContent: "center",
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Box
            key={item}
            sx={{
              width: {
                xs: "100%",
                sm: "calc(50% - 12px)",
                md: "calc(33.333% - 16px)",
                lg: "calc(25% - 18px)",
              },
              minWidth: 280,
            }}
          >
            <Paper sx={{ height: "100%", borderRadius: 4, overflow: "hidden" }}>
              <Skeleton variant="rectangular" width="100%" height={120} />
              <Box sx={{ p: 3 }}>
                <Skeleton
                  variant="text"
                  width="80%"
                  height={30}
                  sx={{ mb: 2 }}
                />
                <Skeleton
                  variant="text"
                  width="60%"
                  height={20}
                  sx={{ mb: 1 }}
                />
                <Skeleton
                  variant="text"
                  width="90%"
                  height={20}
                  sx={{ mb: 3 }}
                />
                <Skeleton
                  variant="rounded"
                  width="100%"
                  height={40}
                  sx={{ mb: 1 }}
                />
                <Skeleton variant="rounded" width="100%" height={40} />
              </Box>
            </Paper>
          </Box>
        ))}
      </Box>
    </Container>
  </Box>
);

const HeaderSection = ({ events }: { events: Event[] }) => {
  // Calculate total available tickets across all events
  const totalAvailableTickets = events.reduce(
    (acc, event) =>
      acc +
      event.ticketTypes.reduce(
        (sum, type) => sum + (type.quantity - (type.sold || 0)),
        0
      ),
    0
  );

  return (
    <Box sx={{ textAlign: "center", mb: 8 }}>
      <Grow in={true} timeout={800}>
        <Box>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mx: "auto",
              mb: 3,
              background: "linear-gradient(45deg, #FF6B6B 0%, #4ECDC4 100%)",
              boxShadow: 3,
            }}
          >
            <LocalActivity sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography
            variant="h2"
            component="h1"
            fontWeight="bold"
            gutterBottom
            sx={{
              background: "linear-gradient(45deg, #2c3e50 0%, #3498db 100%)",
              backgroundClip: "text",
              textFillColor: "transparent",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Discover Events
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{
              maxWidth: 600,
              mx: "auto",
              mb: 2,
            }}
          >
            Find and book tickets for unforgettable experiences
          </Typography>

          {/* Stats */}
          <Box
            sx={{ display: "flex", justifyContent: "center", gap: 4, mt: 3 }}
          >
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {events.length}+
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Events
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h4" fontWeight="bold" color="secondary.main">
                {totalAvailableTickets}+
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tickets Available
              </Typography>
            </Box>
          </Box>
        </Box>
      </Grow>
    </Box>
  );
};

interface SearchSectionProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  theme: ReturnType<typeof useTheme>;
}

const SearchSection = ({ searchTerm, setSearchTerm }: SearchSectionProps) => (
  <Paper
    elevation={3}
    sx={{
      p: 3,
      mb: 6,
      borderRadius: 4,
      background: "white",
      maxWidth: 600,
      mx: "auto",
      border: "1px solid rgba(0, 0, 0, 0.12)",
    }}
  >
    <TextField
      fullWidth
      placeholder="Search events by name, location, or description..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon color="primary" />
          </InputAdornment>
        ),
        sx: {
          borderRadius: 3,
          "& .MuiOutlinedInput-notchedOutline": {
            border: "none",
          },
        },
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: 3,
          backgroundColor: "rgba(25, 118, 210, 0.04)",
        },
      }}
    />
  </Paper>
);

const EventGridCard = ({
  event,
  index,
  onPurchaseClick,
}: {
  event: Event;
  index: number;
  onPurchaseClick: (event: Event, ticketType: TicketType) => void;
}) => {
  const theme = useTheme();

  return (
    <Zoom in={true} timeout={600 + index * 100}>
      <Paper
        sx={{
          height: "100%",
          borderRadius: 4,
          overflow: "hidden",
          transition: "all 0.3s ease",
          background: "white",
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          display: "flex",
          flexDirection: "column",
          "&:hover": {
            transform: "translateY(-8px)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
          },
        }}
      >
        {/* Event Image/Header Area */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            height: 120,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            position: "relative",
            p: 3,
            color: "white",
          }}
        >
          {/* Event Name */}
          <Typography variant="h6" fontWeight="bold">
            {event.name}
          </Typography>

          {/* Bottom Row - Location and Date/Time */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            {/* Location */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flex: 1,
                minWidth: 0,
              }}
            >
              <LocationOn
                sx={{
                  fontSize: 16,
                  color: "rgba(255,255,255,0.9)",
                  mr: 0.5,
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255,255,255,0.9)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1.2,
                }}
              >
                {event.location}
              </Typography>
            </Box>

            {/* Date and Time Chip */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                ml: 1,
                flexShrink: 0,
              }}
            >
              <Chip
                icon={<CalendarToday sx={{ fontSize: 16, color: "white" }} />}
                label={
                  <>
                    {new Date(event.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                    {" • "}
                    {new Date(`2000-01-01T${event.time}`)
                      .toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })
                      .toLowerCase()}
                  </>
                }
                size="small"
                sx={{
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  height: 24,
                  border: "1px solid rgba(255,255,255,0.3)",
                  "& .MuiChip-icon": {
                    color: "white",
                    marginLeft: "4px",
                  },
                  "& .MuiChip-label": {
                    px: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    fontSize: "0.75rem",
                    fontWeight: 500,
                  },
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Content Area */}
        <Box sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Ticket Area*/}
          <Box
            sx={{
              pt: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
              All Ticket Types
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {event.ticketTypes.map((ticketType) => {
                const available = ticketType.quantity - (ticketType.sold || 0);
                const isSoldOut = available <= 0;
                const isLowStock = available > 0 && available <= 10;

                return (
                  <Paper
                    key={ticketType._id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      borderColor: isSoldOut
                        ? "error.light"
                        : isLowStock
                        ? "warning.light"
                        : "primary.light",
                      bgcolor: isSoldOut
                        ? "error.50"
                        : isLowStock
                        ? "warning.50"
                        : "primary.50",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {ticketType.name}
                        </Typography>
                      </Box>
                      <Typography
                        variant="h6"
                        color="primary.main"
                        fontWeight="bold"
                      >
                        ${ticketType.price}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color={
                          isSoldOut
                            ? "error"
                            : isLowStock
                            ? "warning.main"
                            : "success.main"
                        }
                        fontWeight={isSoldOut || isLowStock ? "bold" : "normal"}
                      >
                        {isSoldOut
                          ? "Sold Out"
                          : `${available} of ${ticketType.quantity} available`}
                      </Typography>
                      <Button
                        variant={isSoldOut ? "outlined" : "contained"}
                        size="small"
                        disabled={isSoldOut}
                        onClick={() =>
                          !isSoldOut && onPurchaseClick(event, ticketType)
                        }
                        sx={{
                          borderRadius: 1,
                          minWidth: 80,
                          background: isSoldOut
                            ? "grey.300"
                            : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          color: isSoldOut ? "grey.600" : "white",
                          borderColor: isSoldOut ? "grey.400" : "transparent",
                          "&:hover": {
                            background: isSoldOut
                              ? "grey.300"
                              : "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                          },
                          "&.Mui-disabled": {
                            background: "grey.300",
                            color: "grey.600",
                            borderColor: "grey.400",
                          },
                        }}
                      >
                        {isSoldOut ? "Sold Out" : "Buy"}
                      </Button>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Paper>
    </Zoom>
  );
};

const NoEventsSection = ({
  searchTerm,
  setSearchTerm,
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}) => (
  <Slide in={true} direction="up" timeout={500}>
    <Box sx={{ textAlign: "center", py: 12 }}>
      <Event
        sx={{ fontSize: 120, color: "text.secondary", mb: 3, opacity: 0.5 }}
      />
      <Typography variant="h4" color="text.secondary" gutterBottom>
        {searchTerm ? "No events match your search" : "No upcoming events"}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {searchTerm
          ? "Try different keywords or browse all events"
          : "Check back later for new events"}
      </Typography>
      {searchTerm && (
        <Button
          variant="outlined"
          onClick={() => setSearchTerm("")}
          sx={{ borderRadius: 3 }}
        >
          Clear Search
        </Button>
      )}
    </Box>
  </Slide>
);

interface PurchaseDialogProps {
  open: boolean;
  onClose: () => void;
  selectedEvent: Event | null;
  selectedTicketType: TicketType | null;
  purchaseLoading: boolean;
  onPurchase: (data: PurchaseFormData) => void;
}

const PurchaseDialog = ({
  open,
  onClose,
  selectedEvent,
  selectedTicketType,
  purchaseLoading,
  onPurchase,
}: PurchaseDialogProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseFormSchema),
    mode: "onChange",
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = (data: PurchaseFormData) => {
    onPurchase(data);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 4 },
      }}
    >
      <DialogTitle
        sx={{
          background: "linear-gradient(45deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          textAlign: "center",
          position: "relative",
        }}
      >
        <Typography variant="h5" component="div" fontWeight="bold">
          Get Your Tickets
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          {selectedTicketType?.name} - ${selectedTicketType?.price}
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "white",
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 4 }}>
        {selectedEvent && selectedTicketType && (
          <>
            <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
              You&apos;re booking <strong>{selectedTicketType.name}</strong>{" "}
              tickets for <strong>{selectedEvent.name}</strong>
            </Alert>

            <form onSubmit={handleSubmit(onSubmit)}>
              <TextField
                fullWidth
                label="Full Name"
                {...register("attendeeName")}
                error={!!errors.attendeeName}
                helperText={errors.attendeeName?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person
                        color={errors.attendeeName ? "error" : "primary"}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="Email Address"
                type="email"
                {...register("attendeeEmail")}
                error={!!errors.attendeeEmail}
                helperText={errors.attendeeEmail?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email
                        color={errors.attendeeEmail ? "error" : "primary"}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <Paper
                elevation={2}
                sx={{ p: 3, borderRadius: 3, bgcolor: "grey.50" }}
              >
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Order Summary
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">Ticket Type:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {selectedTicketType.name}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">Event:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {selectedEvent.name}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">Total Price:</Typography>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    color="primary.main"
                  >
                    ${selectedTicketType.price}
                  </Typography>
                </Box>
              </Paper>

              <DialogActions sx={{ p: 0, pt: 3, gap: 2 }}>
                <Button
                  onClick={onClose}
                  variant="outlined"
                  sx={{ borderRadius: 3, flex: 1 }}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  disabled={!isValid || purchaseLoading}
                  sx={{
                    borderRadius: 3,
                    flex: 2,
                    background:
                      "linear-gradient(45deg, #FF6B6B 0%, #4ECDC4 100%)",
                    "&:hover": {
                      background:
                        "linear-gradient(45deg, #FF5252 0%, #26A69A 100%)",
                    },
                  }}
                  type="submit"
                >
                  {purchaseLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    "Complete Purchase"
                  )}
                </Button>
              </DialogActions>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const TicketDisplay = ({
  ticket,
  ticketRef,
}: {
  ticket: PurchasedTicket;
  ticketRef: React.RefObject<HTMLDivElement | null>;
}) => (
  <Box ref={ticketRef} sx={{ p: 3 }}>
    <Paper
      elevation={6}
      sx={{
        p: 4,
        borderRadius: 4,
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        position: "relative",
        overflow: "hidden",
        minHeight: 400,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        "&::before": {
          content: '""',
          position: "absolute",
          top: -50,
          right: -50,
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: -30,
          left: -30,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
        },
      }}
    >
      {/* Ticket Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {ticket.event.name}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            {ticket.ticketType} Ticket
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="h6" fontWeight="bold">
            #{ticket.ticketCode}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Ticket Code
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.3)", my: 3 }} />

      {/* Ticket Details */}
      <Box
        sx={{ display: "flex", justifyContent: "space-between", mb: 3, gap: 2 }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Attendee
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {ticket.attendeeName}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, textAlign: "center" }}>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Date
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {new Date(ticket.event.date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, textAlign: "right" }}>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Time
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {new Date(`2000-01-01T${ticket.event.time}`).toLocaleTimeString(
              "en-US",
              {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }
            )}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Venue
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {ticket.event.location}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, textAlign: "center" }}>
          <QrCode sx={{ fontSize: 60, opacity: 0.9 }} />
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Scan to verify
          </Typography>
        </Box>
        <Box sx={{ flex: 1, textAlign: "right" }}>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Price
          </Typography>
          <Typography variant="h6" fontWeight="bold">
            ${ticket.price}
          </Typography>
        </Box>
      </Box>

      {/* Security Features */}
      <Box sx={{ mt: "auto", textAlign: "center" }}>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          This ticket is valid for one entry. Please present at venue.
        </Typography>
      </Box>
    </Paper>
  </Box>
);

interface SuccessDialogProps {
  open: boolean;
  onClose: () => void;
  purchasedTicket: PurchasedTicket | null;
  downloading: boolean;
  onDownloadImage: () => void;
  onDownloadPDF: () => void;
  ticketRef: React.RefObject<HTMLDivElement | null>;
}

const SuccessDialog = ({
  open,
  onClose,
  purchasedTicket,
  downloading,
  onDownloadImage,
  onDownloadPDF,
  ticketRef,
}: SuccessDialogProps) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="md"
    fullWidth
    PaperProps={{
      sx: {
        borderRadius: 4,
        maxWidth: 600,
      },
    }}
  >
    <DialogTitle sx={{ textAlign: "center", pb: 2, position: "relative" }}>
      <IconButton
        onClick={onClose}
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
        }}
      >
        <Close />
      </IconButton>
      <CheckCircle sx={{ fontSize: 60, color: "success.main", mb: 2 }} />
      <Typography variant="h4" component="div" fontWeight="bold" gutterBottom>
        Ticket Purchased!
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Your ticket has been successfully generated
      </Typography>
    </DialogTitle>
    <DialogContent sx={{ p: 0 }}>
      {purchasedTicket && (
        <TicketDisplay ticket={purchasedTicket} ticketRef={ticketRef} />
      )}
    </DialogContent>
    <DialogActions sx={{ p: 3, gap: 2 }}>
      <Button
        onClick={onDownloadImage}
        variant="outlined"
        startIcon={<Download />}
        disabled={downloading}
        sx={{ borderRadius: 3, flex: 1 }}
      >
        {downloading ? <CircularProgress size={20} /> : "Download Image"}
      </Button>
      <Button
        onClick={onDownloadPDF}
        variant="contained"
        startIcon={<Download />}
        disabled={downloading}
        sx={{
          borderRadius: 3,
          flex: 1,
          background: "linear-gradient(45deg, #FF6B6B 0%, #4ECDC4 100%)",
        }}
      >
        {downloading ? <CircularProgress size={20} /> : "Download PDF"}
      </Button>
    </DialogActions>
  </Dialog>
);

// Main Component
export default function EventsPage() {
  const theme = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedTicketType, setSelectedTicketType] =
    useState<TicketType | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [purchasedTicket, setPurchasedTicket] =
    useState<PurchasedTicket | null>(null);

  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      // Use the get-all-events endpoint that includes sold counts
      const response = await api.get("/events/get-all-events");
      setEvents(response.data);
    } catch (error: unknown) {
      console.error("Failed to fetch events:", error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseClick = (event: Event, ticketType: TicketType) => {
    setSelectedEvent(event);
    setSelectedTicketType(ticketType);
    setPurchaseDialogOpen(true);
  };

  const handlePurchase = async (formData: PurchaseFormData) => {
    if (!selectedEvent || !selectedTicketType) return;

    setPurchaseLoading(true);
    try {
      const response = await api.post("/tickets/purchase", {
        eventId: selectedEvent._id,
        ticketTypeId: selectedTicketType._id,
        attendeeName: formData.attendeeName,
        attendeeEmail: formData.attendeeEmail,
      });

      if (response.data.success) {
        const ticket = response.data.ticket;
        setPurchasedTicket(ticket);
        setPurchaseDialogOpen(false);
        setSuccessDialogOpen(true);
        toast.success("Ticket purchased successfully!");
      }
    } catch (error: unknown) {
      console.error("Purchase error:", error);
      toast.error("Failed to purchase ticket");
    } finally {
      setPurchaseLoading(false);
    }
  };

  const downloadTicketAsImage = async () => {
    if (!ticketRef.current || !purchasedTicket) return;

    setDownloading(true);
    try {
      // Create a wrapper div to center the ticket
      const wrapper = document.createElement("div");
      wrapper.style.display = "flex";
      wrapper.style.justifyContent = "center";
      wrapper.style.alignItems = "center";
      wrapper.style.padding = "20px";
      wrapper.style.background = "white"; // Optional: white background for the wrapper

      const clone = ticketRef.current.cloneNode(true) as HTMLElement;
      wrapper.appendChild(clone);

      document.body.appendChild(wrapper);

      const dataUrl = await toPng(wrapper, {
        backgroundColor: "#ffffff", // White background for the entire image
        width: wrapper.scrollWidth * 2,
        height: wrapper.scrollHeight * 2,
        pixelRatio: 2,
      });

      document.body.removeChild(wrapper);

      const link = document.createElement("a");
      link.download = `ticket-${purchasedTicket.ticketCode}.png`;
      link.href = dataUrl;
      link.click();

      toast.success("Ticket downloaded as image!");
      handleDownloadComplete();
    } catch (error) {
      console.error("Error downloading ticket:", error);
      toast.error("Failed to download ticket");
    } finally {
      setDownloading(false);
    }
  };

  const downloadTicketAsPDF = async () => {
    if (!ticketRef.current || !purchasedTicket) return;

    setDownloading(true);
    try {
      // Create a wrapper div to center the ticket
      const wrapper = document.createElement("div");
      wrapper.style.display = "flex";
      wrapper.style.justifyContent = "center";
      wrapper.style.alignItems = "center";
      wrapper.style.padding = "20px";
      wrapper.style.background = "white";

      const clone = ticketRef.current.cloneNode(true) as HTMLElement;
      wrapper.appendChild(clone);

      document.body.appendChild(wrapper);

      const dataUrl = await toPng(wrapper, {
        backgroundColor: "#ffffff",
        width: wrapper.scrollWidth * 2,
        height: wrapper.scrollHeight * 2,
        pixelRatio: 2,
      });

      document.body.removeChild(wrapper);

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = 180;
      const imgHeight = (wrapper.scrollHeight * imgWidth) / wrapper.scrollWidth;

      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;

      pdf.addImage(dataUrl, "PNG", x, y, imgWidth, imgHeight);
      pdf.save(`ticket-${purchasedTicket.ticketCode}.pdf`);

      toast.success("Ticket downloaded as PDF!");
      handleDownloadComplete();
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadComplete = () => {
    setTimeout(() => {
      setSuccessDialogOpen(false);
      setPurchasedTicket(null);
      fetchEvents(); // Refresh events to update availability
    }, 1000);
  };

  const filteredEvents = events.filter(
    (event) =>
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        py: 4,
      }}
    >
      <Container maxWidth="xl">
        <HeaderSection events={events} />
        <SearchSection
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          theme={theme}
        />

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            justifyContent: { xs: "center", sm: "flex-start" },
          }}
        >
          {filteredEvents.map((event, index) => (
            <Box
              key={event._id}
              sx={{
                width: {
                  xs: "100%",
                  sm: "calc(50% - 12px)",
                  md: "calc(33.333% - 16px)",
                  lg: "calc(25% - 18px)",
                },
                minWidth: 280,
                maxWidth: 400,
              }}
            >
              <EventGridCard
                event={event}
                index={index}
                onPurchaseClick={handlePurchaseClick}
              />
            </Box>
          ))}
        </Box>

        {filteredEvents.length === 0 && (
          <NoEventsSection
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        )}

        <PurchaseDialog
          open={purchaseDialogOpen}
          onClose={() => setPurchaseDialogOpen(false)}
          selectedEvent={selectedEvent}
          selectedTicketType={selectedTicketType}
          purchaseLoading={purchaseLoading}
          onPurchase={handlePurchase}
        />

        <SuccessDialog
          open={successDialogOpen}
          onClose={() => setSuccessDialogOpen(false)}
          purchasedTicket={purchasedTicket}
          downloading={downloading}
          onDownloadImage={downloadTicketAsImage}
          onDownloadPDF={downloadTicketAsPDF}
          ticketRef={ticketRef}
        />
      </Container>
    </Box>
  );
}
