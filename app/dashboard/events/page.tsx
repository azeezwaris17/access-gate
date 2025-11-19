"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/services/api"; // Import API service
import { withAuth } from "@/lib/hocs/withAuth"; // Import HOC

// Material UI Components
import {
  Box,
  Container,
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
  Avatar,
  LinearProgress,
  useTheme,
  Divider,
  InputAdornment,
} from "@mui/material";

// Material UI Icons
import {
  Event,
  LocationOn,
  People,
  ConfirmationNumber,
  AttachMoney,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Add,
  Search as SearchIcon,
  FilterList,
  CalendarToday,
  Schedule,
  Warning,
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
    name: string;
    price: number;
    quantity: number;
    sold: number;
  }>;
  createdAt: string;
  status: "active" | "completed" | "cancelled";
}

/**
 * Status filter type
 */
type StatusFilter = "all" | "active" | "completed" | "cancelled";

function EventsPage() {
  const { admin } = useAuthStore(); // We can access admin info
  const router = useRouter();
  const theme = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  /**
   * Fetch events on component mount and when filters change
   */
  useEffect(() => {
    fetchEvents();
  }, [statusFilter, searchTerm]); // Refetch when filters change

  /**
   * Fetch all events with filtering using API service
   */
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      // Use API service - automatically includes auth token
      const response = await api.get(
        `/events/get-all-events?status=${statusFilter}&search=${searchTerm}` // Removed /api prefix
      );

      if (response.data) {
        setEvents(response.data);
      }
    } catch (error: any) {
      // 401 errors are automatically handled by the API service interceptor
      const errorMessage =
        error.response?.data?.error || "Failed to load events";
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
   * Handle event deletion using API service
   */
  const deleteEvent = async (eventId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      // Use API service for deletion
      await api.delete(`/events/${eventId}`); // Removed /api prefix

      setEvents(events.filter((event) => event._id !== eventId));
      toast.success("Event deleted successfully");
      handleMenuClose();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Failed to delete event";
      
      // Only show toast if it's not a 401 error (already handled)
      if (error.response?.status !== 401) {
        toast.error(errorMessage);
      }
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
    setSelectedEvent(null);
  };

  /**
   * Calculate event status based on date
   */
  const getEventStatus = (
    event: Event
  ): "active" | "completed" | "cancelled" => {
    const eventDate = new Date(event.date);
    const today = new Date();

    if (event.status === "cancelled") return "cancelled";
    if (eventDate < today) return "completed";
    return "active";
  };

  /**
   * Get status chip color
   */
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

  /**
   * Calculate event statistics
   */
  const getTotalTickets = (event: Event) => {
    return event.ticketTypes.reduce((sum, type) => sum + type.quantity, 0);
  };

  const getSoldTickets = (event: Event) => {
    return event.ticketTypes.reduce((sum, type) => sum + (type.sold || 0), 0);
  };

  const getTotalRevenue = (event: Event) => {
    return event.ticketTypes.reduce(
      (sum, type) => sum + type.price * (type.sold || 0),
      0
    );
  };

  /**
   * Format date and time
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
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
   * Loading State
   */
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 12,
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={48} sx={{ mb: 2, color: "primary.main" }} />
          <Typography variant="h6" color="text.secondary" fontWeight="medium">
            Loading events...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ spaceY: 4, p: 3 }}>
      {/* Header Section */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 3,
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
          <Typography variant="h6" color="text.secondary">
            Manage and view all your events{admin && ` • Welcome, ${admin.fullName}`}
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
        <Alert severity="error" icon={<Warning />} sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters and Search Section */}
      <Card
        elevation={2}
        sx={{
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 3,
              alignItems: { xs: "stretch", sm: "center" },
            }}
          >
            {/* Search Field */}
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
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            {/* Status Filter */}
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

            {/* Refresh Button */}
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={fetchEvents}
              sx={{ borderRadius: 2 }}
            >
              Refresh
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Card
          elevation={2}
          sx={{
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            textAlign: "center",
            p: 8,
          }}
        >
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
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {filteredEvents.map((event) => {
            const status = getEventStatus(event);
            const totalTickets = getTotalTickets(event);
            const soldTickets = getSoldTickets(event);
            const revenue = getTotalRevenue(event);
            const soldPercentage =
              totalTickets > 0 ? (soldTickets / totalTickets) * 100 : 0;

            return (
              <Card
                key={event._id}
                elevation={2}
                sx={{
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  transition: "all 0.2s ease",
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  {/* Event Header */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", lg: "row" },
                      gap: 3,
                      alignItems: { xs: "flex-start", lg: "flex-start" },
                      justifyContent: "space-between",
                    }}
                  >
                    {/* Event Info */}
                    <Box
                      sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
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
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            ml: 2,
                          }}
                        >
                          <Chip
                            label={
                              status.charAt(0).toUpperCase() + status.slice(1)
                            }
                            color={getStatusColor(status)}
                            variant="outlined"
                            size="small"
                          />
                          <IconButton
                            onClick={(e) => handleMenuOpen(e, event)}
                            sx={{ color: "text.secondary" }}
                          >
                            <MoreVert />
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Event Details */}
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 3,
                          alignItems: "center",
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <CalendarToday
                            sx={{ fontSize: 20, color: "text.secondary" }}
                          />
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {formatDate(event.date)}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatTime(event.time)}
                            </Typography>
                          </Box>
                        </Box>

                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <LocationOn
                            sx={{ fontSize: 20, color: "text.secondary" }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {event.location}
                          </Typography>
                        </Box>

                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
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

                  {/* Ticket Types */}
                  <Box>
                    <Typography
                      variant="h6"
                      component="h4"
                      fontWeight="medium"
                      gutterBottom
                    >
                      Ticket Types
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 2,
                      }}
                    >
                      {event.ticketTypes.map((ticketType, index) => (
                        <Paper
                          key={index}
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
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {ticketType.sold || 0} sold
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
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
          })}
        </Box>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem
          onClick={() => {
            router.push(`/dashboard/events/${selectedEvent?._id}`);
            handleMenuClose();
          }}
        >
          <Visibility sx={{ mr: 1, fontSize: 20 }} />
          View Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            router.push(`/dashboard/events/${selectedEvent?._id}/edit`);
            handleMenuClose();
          }}
        >
          <Edit sx={{ mr: 1, fontSize: 20 }} />
          Edit Event
        </MenuItem>
        <MenuItem
          onClick={() => selectedEvent && deleteEvent(selectedEvent._id)}
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1, fontSize: 20 }} />
          Delete Event
        </MenuItem>
      </Menu>
    </Box>
  );
}

// Export the authenticated component
export default withAuth(EventsPage);