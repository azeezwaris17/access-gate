// app/dashboard/events/page.tsx
"use client";
import React from 'react'
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
  FilterList,
  CalendarToday,
  Warning,
  CheckCircle,
  PlayArrow,
  Cancel,
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
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<string | null>(null);

  /**
   * Fetch events on component mount and when filters change
   */
  useEffect(() => {
    fetchEvents();
  }, [statusFilter, searchTerm]);

  /**
   * Fetch all events with filtering using API service
   */
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(
        `/events/get-all-events?status=${statusFilter}&search=${searchTerm}`
      );

      if (response.data) {
        setEvents(response.data);
      }
    } catch (error: unknown) {
      console.error("Failed to fetch events:", error);
      const errorMessage = "Failed to load events";
      setError(errorMessage);
      
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
        if (axiosError.response?.status !== 401) {
          toast.error(axiosError.response?.data?.error || errorMessage);
        }
      } else {
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
    try {
      await api.delete(`/events/${eventId}`);
      setEvents(events.filter((event) => event._id !== eventId));
      toast.success("Event deleted successfully");
      setDeleteDialogOpen(false);
    } catch (error: unknown) {
      console.error("Failed to delete event:", error);
      const errorMessage = "Failed to delete event";
      
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
        if (axiosError.response?.status !== 401) {
          toast.error(axiosError.response?.data?.error || errorMessage);
        }
      } else {
        toast.error(errorMessage);
      }
    }
  };

  /**
   * Handle event status update
   */
  const updateEventStatus = async (eventId: string, newStatus: "active" | "completed" | "cancelled") => {
    setStatusUpdateLoading(eventId);
    try {
      const response = await api.patch(`/events/${eventId}/status`, { status: newStatus });
      
      if (response.data.success) {
        setEvents(events.map(event => 
          event._id === eventId ? { ...event, status: newStatus } : event
        ));
        toast.success(`Event status updated to ${newStatus}`);
        setStatusDialogOpen(false);
      }
    } catch (error: unknown) {
      console.error("Failed to update event status:", error);
      const errorMessage = "Failed to update event status";
      
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
        toast.error(axiosError.response?.data?.error || errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setStatusUpdateLoading(null);
    }
  };

  /**
   * Menu handlers
   */
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, eventData: Event) => {
    setAnchorEl(event.currentTarget);
    setSelectedEvent(eventData);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEvent(null);
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
  };

  /**
   * Edit event handlers
   */
  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
  };

  /**
   * Status update handlers
   */
  const handleStatusUpdate = (event: Event) => {
    setSelectedEvent(event);
    setStatusDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseStatusDialog = () => {
    setStatusDialogOpen(false);
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
  };

  /**
   * Calculate event status based on date
   */
  const getEventStatus = (event: Event): "active" | "completed" | "cancelled" => {
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
  const getTotalTickets = (event: Event): number => {
    return event.ticketTypes.reduce((sum: number, type) => sum + type.quantity, 0);
  };

  const getSoldTickets = (event: Event): number => {
    return event.ticketTypes.reduce((sum: number, type) => sum + (type.sold || 0), 0);
  };

  /**
   * Format date and time
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string): string => {
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
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 12 }}>
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
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", gap: 3 }}>
        <Box>
          <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
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
        <Alert severity="error" icon={<Warning />} sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters and Search Section */}
      <Card elevation={2} sx={{ borderTopLeftRadius: 3, borderTopRightRadius: 3, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 3, alignItems: { xs: "stretch", sm: "center" } }}>
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
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
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
        <Card elevation={2} sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, textAlign: "center", p: 8 }}>
          <Event sx={{ fontSize: 64, color: "text.secondary", mb: 3 }} />
          <Typography variant="h5" component="h3" gutterBottom fontWeight="medium">
            No events found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: "auto" }}>
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

            return (
              <Card key={event._id} elevation={2} sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, transition: "all 0.2s ease" }}>
                <CardContent sx={{ p: 4 }}>
                  {/* Event Header */}
                  <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: 3, alignItems: { xs: "flex-start", lg: "flex-start" }, justifyContent: "space-between" }}>
                    {/* Event Info */}
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h5" component="h3" fontWeight="bold" gutterBottom>
                            {event.name}
                          </Typography>
                          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            {event.description}
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 2 }}>
                          <Chip
                            label={status.charAt(0).toUpperCase() + status.slice(1)}
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
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, alignItems: "center" }}>
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
                          <ConfirmationNumber sx={{ fontSize: 20, color: "text.secondary" }} />
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
                    <Typography variant="h6" component="h4" fontWeight="medium" gutterBottom>
                      Ticket Types
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                      {event.ticketTypes.map((ticketType, index) => (
                        <Paper key={index} elevation={1} sx={{ p: 2, borderRadius: 2, bgcolor: "grey.50", flex: "1 1 200px", minWidth: "200px" }}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {ticketType.name}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" color="primary.main">
                              ${ticketType.price}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
          })}
        </Box>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl && selectedEvent)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {selectedEvent ? (
          [
            <MenuItem key="view" onClick={() => handleViewDetails(selectedEvent)}>
              <Visibility sx={{ mr: 1, fontSize: 20 }} />
              View Details
            </MenuItem>,
            <MenuItem key="edit" onClick={() => handleEditEvent(selectedEvent)}>
              <Edit sx={{ mr: 1, fontSize: 20 }} />
              Edit Event
            </MenuItem>,
            <MenuItem key="status" onClick={() => handleStatusUpdate(selectedEvent)}>
              <CheckCircle sx={{ mr: 1, fontSize: 20 }} />
              Update Status
            </MenuItem>,
            <MenuItem key="delete" onClick={() => handleDeleteEvent(selectedEvent)} sx={{ color: "error.main" }}>
              <Delete sx={{ mr: 1, fontSize: 20 }} />
              Delete Event
            </MenuItem>
          ]
        ) : null}
      </Menu>

      {/* View Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {selectedEvent && (
          <>
            <DialogTitle sx={{ 
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <Typography variant="h5" fontWeight="bold">
                Event Details
              </Typography>
              <Chip
                label={selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                color={getStatusColor(selectedEvent.status)}
                sx={{ color: "white", borderColor: "white" }}
                variant="outlined"
              />
            </DialogTitle>
            <DialogContent sx={{ p: 4 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Basic Information */}
                <Box>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Basic Information
                  </Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Event Name</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedEvent.name}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Date & Time</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatDate(selectedEvent.date)} at {formatTime(selectedEvent.time)}
                      </Typography>
                    </Box>
                    <Box sx={{ gridColumn: "1 / -1" }}>
                      <Typography variant="body2" color="text.secondary">Location</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedEvent.location}</Typography>
                    </Box>
                    <Box sx={{ gridColumn: "1 / -1" }}>
                      <Typography variant="body2" color="text.secondary">Description</Typography>
                      <Typography variant="body1">{selectedEvent.description}</Typography>
                    </Box>
                  </Box>
                </Box>

                <Divider />

                {/* Ticket Information */}
                <Box>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Ticket Information
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {selectedEvent.ticketTypes.map((ticketType, index) => (
                      <Paper key={index} elevation={1} sx={{ p: 3, borderRadius: 2 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {ticketType.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              ${ticketType.price} per ticket
                            </Typography>
                          </Box>
                          <Chip
                            label={`${ticketType.sold || 0}/${ticketType.quantity} sold`}
                            color={ticketType.sold === ticketType.quantity ? "error" : "primary"}
                            variant="outlined"
                          />
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" color="text.secondary">
                            Available: {ticketType.quantity - (ticketType.sold || 0)}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            Revenue: ${(ticketType.price * (ticketType.sold || 0)).toFixed(2)}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </Box>

                {/* Event Statistics */}
                <Box>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Event Statistics
                  </Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr 1fr" }, gap: 2 }}>
                    <Paper sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
                      <Typography variant="h4" fontWeight="bold" color="primary.main">
                        {getTotalTickets(selectedEvent)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Total Tickets</Typography>
                    </Paper>
                    <Paper sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
                      <Typography variant="h4" fontWeight="bold" color="success.main">
                        {getSoldTickets(selectedEvent)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Tickets Sold</Typography>
                    </Paper>
                    <Paper sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
                      <Typography variant="h4" fontWeight="bold" color="info.main">
                        {getTotalTickets(selectedEvent) - getSoldTickets(selectedEvent)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Available</Typography>
                    </Paper>
                    <Paper sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
                      <Typography variant="h4" fontWeight="bold" color="warning.main">
                        ${selectedEvent.ticketTypes.reduce((sum: number, type) => sum + (type.price * (type.sold || 0)), 0).toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                    </Paper>
                  </Box>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 1 }}>
              <Button onClick={handleCloseViewDialog} variant="outlined">
                Close
              </Button>
              <Button 
                variant="contained"
                onClick={() => {
                  handleCloseViewDialog();
                  handleEditEvent(selectedEvent);
                }}
              >
                Edit Event
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ 
          background: "linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)", 
          color: "white"
        }}>
          <Typography variant="h5" fontWeight="bold">
            Edit Event
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Typography variant="body1" sx={{ mb: 3 }}>
            You are about to edit <strong>{selectedEvent?.name}</strong>. This will open the event editor where you can modify event details, ticket types, and other information.
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Note: Some changes may affect existing ticket holders. Please review carefully.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={handleCloseEditDialog} variant="outlined">
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={() => {
              handleCloseEditDialog();
              router.push(`/dashboard/events/${selectedEvent?._id}/edit`);
            }}
          >
            Continue to Edit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={handleCloseStatusDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ 
          background: "linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)", 
          color: "white"
        }}>
          <Typography variant="h5" fontWeight="bold">
            Update Event Status
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Update status for <strong>{selectedEvent?.name}</strong>
          </Typography>
          
          {selectedEvent && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => updateEventStatus(selectedEvent._id, "active")}
                disabled={selectedEvent.status === "active" || statusUpdateLoading === selectedEvent._id}
                startIcon={<PlayArrow />}
              >
                Mark as Active
              </Button>
              <Button
                variant="outlined"
                onClick={() => updateEventStatus(selectedEvent._id, "completed")}
                disabled={selectedEvent.status === "completed" || statusUpdateLoading === selectedEvent._id}
                startIcon={<CheckCircle />}
              >
                Mark as Completed
              </Button>
              <Button
                variant="outlined"
                onClick={() => updateEventStatus(selectedEvent._id, "cancelled")}
                disabled={selectedEvent.status === "cancelled" || statusUpdateLoading === selectedEvent._id}
                startIcon={<Cancel />}
                color="error"
              >
                Cancel Event
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseStatusDialog} variant="outlined">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Event Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ 
          background: "linear-gradient(135deg, #f44336 0%, #e57373 100%)", 
          color: "white"
        }}>
          <Typography variant="h5" fontWeight="bold">
            Delete Event
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete <strong>{selectedEvent?.name}</strong>?
          </Typography>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              Warning: This action cannot be undone!
            </Typography>
            <Typography variant="body2">
              All event data, including ticket information and attendee details, will be permanently deleted.
            </Typography>
          </Alert>
          <Typography variant="body2" color="text.secondary">
            This will affect {selectedEvent && getSoldTickets(selectedEvent)} ticket holders.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={handleCloseDeleteDialog} variant="outlined">
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={() => selectedEvent && deleteEvent(selectedEvent._id)}
          >
            Delete Event
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default withAuth(EventsPage);