// app/dashboard/events/all-events/page.tsx
"use client";
import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/services/api";
import { withAuth } from "@/lib/hocs/withAuth";

// Material UI Components
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Menu,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Skeleton,
} from "@mui/material";

// Material UI Icons
import {
  Event,
  LocationOn,
  ConfirmationNumber,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Add,
  Search as SearchIcon,
  CalendarToday,
  Warning,
  CheckCircle,
  Close,
  Info,
  Refresh,
  AttachMoney,
  Numbers,
} from "@mui/icons-material";

/**
 * Interface for Event data structure
 */
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
    quantity: number;
    sold: number;
    available: number;
    description?: string;
    specialConditions?: string;
  }>;
  createdAt: string;
  status: "active" | "completed" | "cancelled";
  totalRevenue?: number;
  totalTickets?: number;
  totalSold?: number;
  totalAvailable?: number;
}

interface TicketType {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
  available: number;
  description?: string;
  specialConditions?: string;
}

/**
 * Status filter type
 */
type StatusFilter = "all" | "active" | "completed" | "cancelled";

// Custom Dialog Component
const CustomDialog = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = "md",
  gradient = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  gradient?: string;
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth={maxWidth}
    fullWidth
    PaperProps={{
      sx: {
        borderRadius: 3,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      },
    }}
  >
    <DialogTitle
      sx={{
        background: gradient,
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        py: 2,
      }}
    >
      <Typography
        component="span"
        variant="h5"
        fontWeight="bold"
        sx={{ color: "white" }}
      >
        {title}
      </Typography>
      <IconButton onClick={onClose} sx={{ color: "white" }}>
        <Close />
      </IconButton>
    </DialogTitle>
    <DialogContent sx={{ p: 0 }}>{children}</DialogContent>
    {actions && <DialogActions sx={{ p: 3, gap: 1 }}>{actions}</DialogActions>}
  </Dialog>
);

// Event Card Skeleton Component
const EventCardSkeleton = () => (
  <Card
    elevation={2}
    sx={{
      borderRadius: 3,
      opacity: 0.7,
    }}
  >
    <CardContent sx={{ p: 4 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          gap: 3,
          alignItems: { xs: "flex-start", lg: "flex-start" },
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="80%" height={40} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="100%" height={24} sx={{ mb: 2 }} />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 2 }}>
              <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 16 }} />
              <Skeleton variant="circular" width={40} height={40} />
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarToday sx={{ fontSize: 20, color: "text.secondary" }} />
              <Box>
                <Skeleton variant="text" width={120} height={20} />
                <Skeleton variant="text" width={80} height={16} />
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LocationOn sx={{ fontSize: 20, color: "text.secondary" }} />
              <Skeleton variant="text" width={150} height={20} />
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ConfirmationNumber sx={{ fontSize: 20, color: "text.secondary" }} />
              <Skeleton variant="text" width={100} height={20} />
            </Box>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box>
        <Skeleton variant="text" width={120} height={32} sx={{ mb: 2 }} />
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              width={200}
              height={80}
              sx={{ borderRadius: 2 }}
            />
          ))}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// Event Card Component
const EventCard = ({
  event,
  onMenuOpen,
}: {
  event: Event;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, eventData: Event) => void;
}) => {
  const status = getEventStatus(event);
  const totalTickets = getTotalTickets(event);
  const soldTickets = getSoldTickets(event);

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 3,
        transition: "all 0.2s ease",
        opacity: status === "completed" ? 0.7 : 1,
        "&:hover": {
          boxShadow: 4,
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            gap: 3,
            alignItems: { xs: "flex-start", lg: "flex-start" },
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h5"
                  component="h3"
                  fontWeight="bold"
                  gutterBottom
                >
                  {event.name}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {event.description}
                </Typography>
              </Box>

              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, ml: 2 }}
              >
                <Chip
                  label={status.charAt(0).toUpperCase() + status.slice(1)}
                  color={getStatusColor(status)}
                  variant="outlined"
                  size="small"
                />
                <IconButton
                  onClick={(e) => onMenuOpen(e, event)}
                  sx={{ color: "text.secondary" }}
                >
                  <MoreVert />
                </IconButton>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 3,
                alignItems: "center",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CalendarToday sx={{ fontSize: 20, color: "text.secondary" }} />
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {formatDate(event.date)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(event.time)}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LocationOn sx={{ fontSize: 20, color: "text.secondary" }} />
                <Typography variant="body2" color="text.secondary">
                  {event.location}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ConfirmationNumber
                  sx={{ fontSize: 20, color: "text.secondary" }}
                />
                <Typography variant="body2" color="text.secondary">
                  {soldTickets} / {totalTickets} sold
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography
            variant="h6"
            component="h4"
            fontWeight="medium"
            gutterBottom
          >
            Ticket Types
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {event.ticketTypes.map((ticketType, index) => (
              <Paper
                key={ticketType._id || index}
                elevation={1}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "grey.50",
                  flex: "1 1 200px",
                  minWidth: "200px",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" fontWeight="medium">
                    {ticketType.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    color="primary.main"
                  >
                    ${ticketType.price}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {ticketType.sold || 0} sold
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {ticketType.quantity} total
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Event Statistics Component
const EventStatistics = ({ event }: { event: Event }) => {
  const totalTickets = getTotalTickets(event);
  const soldTickets = getSoldTickets(event);
  const totalRevenue = event.ticketTypes.reduce(
    (sum: number, type) => sum + type.price * (type.sold || 0),
    0
  );

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
      <Paper
        sx={{
          p: 2,
          textAlign: "center",
          borderRadius: 2,
          flex: "1 1 200px",
          minWidth: "150px",
        }}
      >
        <Typography variant="h4" fontWeight="bold" color="primary.main">
          {totalTickets}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total Tickets
        </Typography>
      </Paper>
      <Paper
        sx={{
          p: 2,
          textAlign: "center",
          borderRadius: 2,
          flex: "1 1 200px",
          minWidth: "150px",
        }}
      >
        <Typography variant="h4" fontWeight="bold" color="success.main">
          {soldTickets}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tickets Sold
        </Typography>
      </Paper>
      <Paper
        sx={{
          p: 2,
          textAlign: "center",
          borderRadius: 2,
          flex: "1 1 200px",
          minWidth: "150px",
        }}
      >
        <Typography variant="h4" fontWeight="bold" color="info.main">
          {totalTickets - soldTickets}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Available
        </Typography>
      </Paper>
      <Paper
        sx={{
          p: 2,
          textAlign: "center",
          borderRadius: 2,
          flex: "1 1 200px",
          minWidth: "150px",
        }}
      >
        <Typography variant="h4" fontWeight="bold" color="warning.main">
          ${totalRevenue.toFixed(2)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total Revenue
        </Typography>
      </Paper>
    </Box>
  );
};

// Helper functions
const getEventStatus = (event: Event): "active" | "completed" | "cancelled" => {
  if (event.status === "cancelled") return "cancelled";
  const eventDate = new Date(event.date);
  const today = new Date();
  if (eventDate < today) return "completed";
  return "active";
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "success";
    case "completed":
      return "primary";
    case "cancelled":
      return "error";
    default:
      return "default";
  }
};

const getTotalTickets = (event: Event): number => {
  return event.ticketTypes.reduce(
    (sum: number, type) => sum + type.quantity,
    0
  );
};

const getSoldTickets = (event: Event): number => {
  return event.ticketTypes.reduce(
    (sum: number, type) => sum + (type.sold || 0),
    0
  );
};

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};

const formatTime = (timeString: string): string => {
  try {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "Invalid Time";
  }
};

// Ticket Type Editor Component
const TicketTypeEditor = ({
  ticketTypes,
  onChange,
}: {
  ticketTypes: TicketType[];
  onChange: (ticketTypes: TicketType[]) => void;
}) => {
  const handleTicketTypeChange = (index: number, field: string, value: string | number) => {
    const updatedTicketTypes = [...ticketTypes];
    updatedTicketTypes[index] = {
      ...updatedTicketTypes[index],
      [field]: value,
    };
    onChange(updatedTicketTypes);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        Ticket Types
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        You can update ticket prices and quantities. Note: You cannot reduce quantity below the number of tickets already sold.
      </Alert>
      
      <Stack spacing={3}>
        {ticketTypes.map((ticketType, index) => (
          <Paper key={ticketType._id || index} elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ConfirmationNumber sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">
                {ticketType.name}
              </Typography>
            </Box>

            {/* Flexbox layout instead of Grid */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 3,
              mb: 2 
            }}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={ticketType.price}
                  onChange={(e) => handleTicketTypeChange(index, 'price', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoney />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Ticket price in USD"
                />
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={ticketType.quantity}
                  onChange={(e) => {
                    const newQuantity = parseInt(e.target.value) || 0;
                    if (newQuantity >= ticketType.sold) {
                      handleTicketTypeChange(index, 'quantity', newQuantity);
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Numbers />
                      </InputAdornment>
                    ),
                  }}
                  error={ticketType.quantity < ticketType.sold}
                  helperText={
                    ticketType.quantity < ticketType.sold
                      ? `Cannot be less than ${ticketType.sold} (already sold)`
                      : `${ticketType.sold} tickets already sold`
                  }
                />
              </Box>
            </Box>

            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Current Stats:</strong> {ticketType.sold} sold • {ticketType.quantity - ticketType.sold} available • ${(ticketType.price * ticketType.sold).toFixed(2)} revenue
              </Typography>
            </Box>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

// Main Component
function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: "",
    date: "",
    time: "",
    location: "",
    description: "",
    ticketTypes: [] as Array<{
      _id: string;
      name: string;
      price: number;
      quantity: number;
      sold: number;
      available: number;
      description?: string;
      specialConditions?: string;
    }>,
  });

  /**
   * Fetch events on component mount and when filters change
   */
  useEffect(() => {
    fetchEvents();
  }, [statusFilter, searchTerm]);

  /**
   * Fetch all events with filtering using API service
   */
  const fetchEvents = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError("");
    try {
      const response = await api.get(
        `/v1/events/get-all-events?status=${statusFilter}&search=${searchTerm}`
      );

      console.log("API Response:", response.data);

      if (response.data && response.data.success) {
        setEvents(response.data.events || []);
        if (isRefresh) {
          toast.success("Events refreshed successfully");
        }
      } else {
        setError("Failed to load events: Invalid response format");
        toast.error("Failed to load events");
      }
    } catch (err: unknown) {
      console.error("Failed to fetch events:", err);
      const errorMessage = "Failed to load events";
      setError(errorMessage);

      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosError = err as {
          response?: { status?: number; data?: { error?: string } };
        };
        if (axiosError.response?.status !== 401) {
          toast.error(axiosError.response?.data?.error || errorMessage);
        }
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchEvents(true);
  };

  /**
   * Handle event deletion using API service
   */
  const deleteEvent = async (eventId: string) => {
    if (!selectedEvent) return;

    setDeleteLoading(true);
    try {
      // Use the correct API endpoint structure
      const response = await api.delete(`/v1/events/${eventId}/delete-event`);

      if (response.data && response.data.success) {
        setEvents(events.filter((event) => event._id !== eventId));
        toast.success("Event deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedEvent(null);
      } else {
        throw new Error(response.data?.error || "Failed to delete event");
      }
    } catch (err: unknown) {
      console.error("Failed to delete event:", err);
      const errorMessage = "Failed to delete event";

      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosError = err as {
          response?: { status?: number; data?: { error?: string } };
        };
        if (axiosError.response?.status === 404) {
          toast.error("Event not found or already deleted");
        } else if (axiosError.response?.status !== 401) {
          toast.error(axiosError.response?.data?.error || errorMessage);
        }
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  /**
   * Handle mark event status as completed
   */
  const completeEvent = async (eventId: string) => {
    if (!selectedEvent) return;

    setCompleteLoading(true);
    try {
      const response = await api.patch(
       `/v1/events/${eventId}/update-event-status`,
        {
          status: "completed",
        }
      );

      if (response.data.success) {
        setEvents(
          events.map((event) =>
            event._id === eventId ? { ...event, status: "completed" } : event
          )
        );
        toast.success("Event marked as completed successfully");
        setCompleteDialogOpen(false);
        setSelectedEvent(null);
      }
    } catch (err: unknown) {
      console.error("Failed to complete event:", err);
      const errorMessage = "Failed to mark event as completed";

      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosError = err as {
          response?: { status?: number; data?: { error?: string } };
        };
        toast.error(axiosError.response?.data?.error || errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setCompleteLoading(false);
    }
  };

  /**
   * Handle event edit
   */
  const updateEvent = async (eventId: string) => {
    if (!selectedEvent) return;

    setEditLoading(true);
    try {
      const response = await api.put(
        `/v1/events/${eventId}/edit-event`,
        editFormData
      );

      if (response.data.success) {
        // Create updated event with proper type compatibility
        const updatedEvent: Event = {
          ...selectedEvent,
          name: editFormData.name,
          date: editFormData.date,
          time: editFormData.time,
          location: editFormData.location,
          description: editFormData.description,
          ticketTypes: editFormData.ticketTypes.map((ticketType) => ({
            ...ticketType,
            available: ticketType.quantity - ticketType.sold,
          })),
        };

        setEvents(
          events.map((event) => (event._id === eventId ? updatedEvent : event))
        );
        toast.success("Event updated successfully");
        setEditDialogOpen(false);
        setSelectedEvent(null);
        fetchEvents(); // Refresh the list
      }
    } catch (err: unknown) {
      console.error("Failed to update event:", err);
      const errorMessage = "Failed to update event";

      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosError = err as {
          response?: { status?: number; data?: { error?: string } };
        };
        toast.error(axiosError.response?.data?.error || errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setEditLoading(false);
    }
  };

  /**
   * Menu handlers
   */
  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    eventData: Event
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedEvent(eventData);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  /**
   * View details handlers
   */
  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event);
    setViewDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedEvent(null);
  };

  /**
   * Edit event handlers
   */
  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setEditFormData({
      name: event.name,
      date: event.date.split("T")[0],
      time: event.time,
      location: event.location,
      description: event.description,
      ticketTypes: event.ticketTypes,
    });
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedEvent(null);
    setEditFormData({
      name: "",
      date: "",
      time: "",
      location: "",
      description: "",
      ticketTypes: [],
    });
  };

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

const handleTicketTypesChange = (ticketTypes: TicketType[]) => {
  setEditFormData((prev) => ({
    ...prev,
    ticketTypes,
  }));
};

  /**
   * Complete event handlers
   */
  const handleCompleteEvent = (event: Event) => {
    setSelectedEvent(event);
    setCompleteDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseCompleteDialog = () => {
    setCompleteDialogOpen(false);
    setSelectedEvent(null);
  };

  /**
   * Delete event handlers
   */
  const handleDeleteEvent = (event: Event) => {
    setSelectedEvent(event);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedEvent(null);
  };

  /**
   * Filter events based on search and status
   */
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || getEventStatus(event) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  /**
   * Loading State - Initial Load
   */
  if (isLoading && !events.length) {
    return (
      <Box sx={{ p: 3 }}>
        {/* Header Section Skeleton */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 3,
            mb: 4,
          }}
        >
          <Box>
            <Skeleton variant="text" width={200} height={48} sx={{ mb: 1 }} />
          </Box>
          <Skeleton variant="rectangular" width={200} height={48} sx={{ borderRadius: 3 }} />
        </Box>

        {/* Filters and Search Section Skeleton */}
        <Card elevation={2} sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={3}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 2 }} />
              <Skeleton variant="rectangular" width={140} height={56} sx={{ borderRadius: 2 }} />
              <Skeleton variant="circular" width={40} height={40} />
            </Stack>
          </CardContent>
        </Card>

        {/* Events List Skeleton */}
        <Stack spacing={3}>
          {[1, 2, 3].map((i) => (
            <EventCardSkeleton key={i} />
          ))}
        </Stack>
      </Box>
    );
  }

  /**
   * Loading State - Refresh
   */
  if (isRefreshing && events.length) {
    return (
      <Box sx={{ p: 3 }}>
        {/* Header Section */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 3,
            mb: 4,
          }}
        >
          <Box>
            <Typography
              variant="h3"
              component="h1"
              fontWeight="bold"
              gutterBottom
            >
              All Events
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push("/dashboard/events/create-event")}
            sx={{
              background: "linear-gradient(45deg, #2196F3 0%, #21CBF3 100%)",
              px: 4,
              py: 1.5,
              borderRadius: 3,
              "&:hover": {
                background: "linear-gradient(45deg, #1976D2 0%, #00ACC1 100%)",
                transform: "translateY(-1px)",
                boxShadow: 4,
              },
              transition: "all 0.2s ease-in-out",
            }}
          >
            Create New Event
          </Button>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert
            severity="error"
            icon={<Warning />}
            sx={{ borderRadius: 3, mb: 3 }}
          >
            {error}
          </Alert>
        )}

        {/* Filters and Search Section */}
        <Card elevation={2} sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={3}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <TextField
                fullWidth
                placeholder="Search events by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />

              <FormControl sx={{ minWidth: 140 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) =>
                    setStatusFilter(e.target.value as StatusFilter)
                  }
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>

              <IconButton
                onClick={handleRefresh}
                sx={{
                  backgroundColor: "white",
                  border: "1px solid",
                  borderColor: "divider",
                  "&:hover": { backgroundColor: "grey.50" },
                }}
              >
                <Refresh />
              </IconButton>
            </Stack>
          </CardContent>
        </Card>

        {/* Events List Skeleton */}
        <Stack spacing={3}>
          {[1, 2, 3].map((i) => (
            <EventCardSkeleton key={i} />
          ))}
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 3,
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h3"
            component="h1"
            fontWeight="bold"
            gutterBottom
          >
            All Events
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/dashboard/events/create-event")}
          sx={{
            background: "linear-gradient(45deg, #2196F3 0%, #21CBF3 100%)",
            px: 4,
            py: 1.5,
            borderRadius: 3,
            "&:hover": {
              background: "linear-gradient(45deg, #1976D2 0%, #00ACC1 100%)",
              transform: "translateY(-1px)",
              boxShadow: 4,
            },
            transition: "all 0.2s ease-in-out",
          }}
        >
          Create New Event
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          icon={<Warning />}
          sx={{ borderRadius: 3, mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {/* Filters and Search Section */}
      <Card elevation={2} sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={3}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <TextField
              fullWidth
              placeholder="Search events by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            <FormControl sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>

            <IconButton
              onClick={handleRefresh}
              sx={{
                backgroundColor: "white",
                border: "1px solid",
                borderColor: "divider",
                "&:hover": { backgroundColor: "grey.50" },
              }}
            >
              <Refresh />
            </IconButton>
          </Stack>
        </CardContent>
      </Card>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Card elevation={2} sx={{ borderRadius: 3, textAlign: "center", p: 8 }}>
          <Event sx={{ fontSize: 64, color: "text.secondary", mb: 3 }} />
          <Typography
            variant="h5"
            component="h3"
            gutterBottom
            fontWeight="medium"
          >
            No events found
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: 400, mx: "auto" }}
          >
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Get started by creating your first event"}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push("/dashboard/events/create-event")}
            sx={{ borderRadius: 2 }}
          >
            Create Event
          </Button>
        </Card>
      ) : (
        <Stack spacing={3}>
          {filteredEvents.map((event) => (
            <EventCard
              key={event._id}
              event={event}
              onMenuOpen={handleMenuOpen}
            />
          ))}
        </Stack>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl && selectedEvent)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        {selectedEvent && [
          <MenuItem key="view" onClick={() => handleViewDetails(selectedEvent)}>
            <Visibility sx={{ mr: 1, fontSize: 20 }} />
            View Details
          </MenuItem>,
          <MenuItem key="edit" onClick={() => handleEditEvent(selectedEvent)}>
            <Edit sx={{ mr: 1, fontSize: 20 }} />
            Edit Event
          </MenuItem>,
          <MenuItem
            key="complete"
            onClick={() => handleCompleteEvent(selectedEvent)}
          >
            <CheckCircle sx={{ mr: 1, fontSize: 20 }} />
            Mark as Completed
          </MenuItem>,

          <MenuItem
            key="delete"
            onClick={() => handleDeleteEvent(selectedEvent)}
            sx={{ color: "error.main" }}
          >
            <Delete sx={{ mr: 1, fontSize: 20 }} />
            Delete Event
          </MenuItem>,
        ]}
      </Menu>

      {/* View Selected Event Details Dialog */}
      <CustomDialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        title="Event Details"
        maxWidth="md"
        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        actions={
          <>
            <Button
              variant="contained"
              onClick={() => {
                handleCloseViewDialog();
                handleEditEvent(selectedEvent!);
              }}
              startIcon={<Edit />}
            >
              Edit Event
            </Button>

            <Button
              variant="contained"
              color="error"
              onClick={() => {
                handleCloseViewDialog();
                handleDeleteEvent(selectedEvent!);
              }}
              startIcon={<Delete />}
            >
              Delete Event
            </Button>
          </>
        }
      >
        {selectedEvent && (
          <Box sx={{ p: 4 }}>
            <Stack spacing={3}>
              {/* Basic Information */}
              <Box>
                <Typography
                  variant="h6"
                  gutterBottom
                  fontWeight="bold"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Info color="primary" />
                  Basic Information
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 3,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Event Name
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedEvent.name}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Date & Time
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatDate(selectedEvent.date)} at{" "}
                        {formatTime(selectedEvent.time)}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedEvent.location}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body1">
                      {selectedEvent.description}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* Ticket Information */}
              <Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Ticket Information
                </Typography>
                <Stack spacing={2}>
                  {selectedEvent.ticketTypes.map((ticketType, index) => (
                    <Paper
                      key={ticketType._id || index}
                      elevation={1}
                      sx={{ p: 3, borderRadius: 2 }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 2,
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {ticketType.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ${ticketType.price} per ticket
                          </Typography>
                        </Box>
                        <Chip
                          label={`${ticketType.sold || 0}/${
                            ticketType.quantity
                          } sold`}
                          color={
                            ticketType.sold === ticketType.quantity
                              ? "error"
                              : "primary"
                          }
                          variant="outlined"
                        />
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Available:{" "}
                          {ticketType.quantity - (ticketType.sold || 0)}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          Revenue: $
                          {(ticketType.price * (ticketType.sold || 0)).toFixed(
                            2
                          )}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              </Box>

              {/* Event Statistics */}
              <Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Event Statistics
                </Typography>
                <EventStatistics event={selectedEvent} />
              </Box>
            </Stack>
          </Box>
        )}
      </CustomDialog>

      {/* Edit Event Dialog */}
      <CustomDialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        title="Edit Event"
        maxWidth="lg"
        gradient="linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)"
        actions={
          <>
            <Button
              variant="contained"
              onClick={() => updateEvent(selectedEvent!._id)}
              disabled={editLoading}
              startIcon={
                editLoading ? <CircularProgress size={20} /> : <Edit />
              }
            >
              {editLoading ? "Updating..." : "Update Event"}
            </Button>
          </>
        }
      >
        {selectedEvent && (
          <Box sx={{ p: 4 }}>
            <Stack spacing={3}>
              <Alert severity="info">
                You are editing <strong>{selectedEvent.name}</strong>. Make your
                changes below.
              </Alert>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <TextField
                  fullWidth
                  label="Event Name"
                  value={editFormData.name}
                  onChange={(e) => handleEditFormChange("name", e.target.value)}
                  required
                />
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: 3,
                  }}
                >
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    value={editFormData.date}
                    onChange={(e) =>
                      handleEditFormChange("date", e.target.value)
                    }
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Time"
                    type="time"
                    value={editFormData.time}
                    onChange={(e) =>
                      handleEditFormChange("time", e.target.value)
                    }
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Box>
                <TextField
                  fullWidth
                  label="Location"
                  value={editFormData.location}
                  onChange={(e) =>
                    handleEditFormChange("location", e.target.value)
                  }
                  required
                />
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={4}
                  value={editFormData.description}
                  onChange={(e) =>
                    handleEditFormChange("description", e.target.value)
                  }
                  required
                />
              </Box>

              <Divider />

              {/* Ticket Types Editor */}
              <TicketTypeEditor
                ticketTypes={editFormData.ticketTypes}
                onChange={handleTicketTypesChange}
              />
            </Stack>
          </Box>
        )}
      </CustomDialog>

      {/* Mark As Complete Event Confirmation Dialog */}
      <CustomDialog
        open={completeDialogOpen}
        onClose={handleCloseCompleteDialog}
        title="Mark as Completed"
        maxWidth="sm"
        gradient="linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)"
        actions={
          <>
            <Button
              variant="contained"
              color="success"
              onClick={() => completeEvent(selectedEvent!._id)}
              disabled={completeLoading}
              startIcon={
                completeLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <CheckCircle />
                )
              }
            >
              {completeLoading ? "Marking..." : "Mark as Completed"}
            </Button>
          </>
        }
      >
        {selectedEvent && (
          <Box sx={{ p: 4 }}>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Are you sure you want to mark{" "}
              <strong>{selectedEvent.name}</strong> as completed?
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                Note: This action cannot be reversed!
              </Typography>
              <Typography variant="body2">
                Once completed, the event will be read-only and no further
                changes can be made.
              </Typography>
            </Alert>
            <Typography variant="body2" color="text.secondary">
              This event has {getSoldTickets(selectedEvent)} tickets sold.
            </Typography>
          </Box>
        )}
      </CustomDialog>

      {/* Delete Event Confirmation Dialog */}
      <CustomDialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        title="Delete Event"
        maxWidth="sm"
        gradient="linear-gradient(135deg, #f44336 0%, #e57373 100%)"
        actions={
          <>
            <Button
              variant="contained"
              color="error"
              onClick={() => deleteEvent(selectedEvent!._id)}
              disabled={deleteLoading}
              startIcon={
                deleteLoading ? <CircularProgress size={20} /> : <Delete />
              }
            >
              {deleteLoading ? "Deleting..." : "Delete Event"}
            </Button>
          </>
        }
      >
        {selectedEvent && (
          <Box sx={{ p: 4 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to delete{" "}
              <strong>{selectedEvent.name}</strong>?
            </Typography>
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                Warning: This action cannot be undone!
              </Typography>
              <Typography variant="body2">
                All event data, including ticket information and attendee
                details, will be permanently deleted.
              </Typography>
            </Alert>
            <Typography variant="body2" color="text.secondary">
              This will affect {getSoldTickets(selectedEvent)} ticket holders.
            </Typography>
          </Box>
        )}
      </CustomDialog>
    </Box>
  );
}

export default withAuth(EventsPage);