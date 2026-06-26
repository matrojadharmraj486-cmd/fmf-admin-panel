import { useEffect, useState } from "react";
import { listBanners, uploadBanner, deleteBanner, updateBanner } from "../services/api.js";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  TextField,
  Grid,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Switch,
} from "@mui/material";
import { Icon } from "@iconify/react";

const bannerTypeOptions = [
  { label: "Banner 1", value: "banner1" },
  { label: "Banner 2", value: "banner2" },
  { label: "Banner 3", value: "banner3" },
  { label: "Banner 4", value: "banner4" },
  { label: "Banner 5", value: "banner5" },
];

function normalizeBannerType(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/^(?:banner|type)\s*(\d+)$/i);
  if (match) return `banner${match[1]}`;
  return raw;
}

function formatBannerType(value) {
  const normalized = normalizeBannerType(value);
  return bannerTypeOptions.find((type) => type.value === normalized)?.label || value || "-";
}

export default function Banners() {
  const bannerPositionOptions = [1, 2, 3, 4, 5];
  const routeOptions = [
    { label: "Splash", value: "/" },
    { label: "Authentication", value: "/authenticationView" },
    { label: "Email Authentication", value: "/emailAuthenticationView" },
    { label: "Verify OTP", value: "/verifyOtpView" },
    { label: "Add Other Details", value: "/addOtherDetailsView" },
    { label: "Home", value: "/homeView" },
    { label: "Course", value: "/courseView" },
    { label: "FAQ", value: "/faqView" },
    { label: "Profile", value: "/profileView" },
    { label: "Main Nav", value: "/mainNavView" },
    { label: "Notification", value: "/notificationView" },
    { label: "Contact Us", value: "/contactUsView" },
    { label: "Settings", value: "/settingsView" },
    { label: "Add Opinion", value: "/addOpinionView" },
    { label: "Edit Profile", value: "/editProfileView" },
    { label: "Plans", value: "/plansView" },
    { label: "Bookmark", value: "/bookmarkView" },
    { label: "Question Part", value: "/QuestionPartView" },
    { label: "Questions", value: "/questionsView" },
    { label: "Forgot Password", value: "/forgotPasswordView" },
    { label: "Search", value: "/searchView" },
    { label: "Other (External URL)", value: "other" },
  ];

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [sourceType, setSourceType] = useState("file");
  const [bannerType, setBannerType] = useState("");
  const [bannerPosition, setBannerPosition] = useState("");
  const [redirectionUrl, setRedirectionUrl] = useState("");
  const [routeChoice, setRouteChoice] = useState("");
  const [filterType, setFilterType] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editId, setEditId] = useState("");
  const [editSourceType, setEditSourceType] = useState("keep");
  const [editFile, setEditFile] = useState(null);
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editBannerType, setEditBannerType] = useState("");
  const [editBannerPosition, setEditBannerPosition] = useState("");
  const [editRedirectionUrl, setEditRedirectionUrl] = useState("");
  const [editRouteChoice, setEditRouteChoice] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  const openEdit = (b) => {
    const redirect = b?.redirectionUrl || "";
    const matched = routeOptions.find((r) => r.value === redirect);
    setEditId(b?._id || b?.id || "");
    setEditBannerType(normalizeBannerType(b?.bannerType || b?.type || ""));
    setEditBannerPosition(b?.position ? String(b.position) : "");
    setEditRedirectionUrl(redirect);
    setEditRouteChoice(matched ? matched.value : redirect ? "other" : "");
    setEditImageUrl(b?.imageUrl || "");
    setEditFile(null);
    setEditSourceType("keep");
    setEditIsActive(typeof b?.isActive === "boolean" ? b.isActive : true);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditSaving(false);
    setEditId("");
    setEditFile(null);
    setEditImageUrl("");
    setEditBannerType("");
    setEditBannerPosition("");
    setEditRedirectionUrl("");
    setEditRouteChoice("");
    setEditSourceType("keep");
    setEditIsActive(true);
  };

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await listBanners(filterType ? { bannerType: filterType } : {});
      const banners = Array.isArray(res) ? res : res?.data || [];
      setItems([...banners].sort((a, b) => (a?.position || 999) - (b?.position || 999)));
    } catch (err) {
      setItems([]);
      setError("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [filterType]);

  const add = async (e) => {
    e.preventDefault();
    setError("");

    if (!bannerType.trim()) {
      setError("Please select banner type");
      return;
    }

    if (!bannerPosition) {
      setError("Please select banner position");
      return;
    }

    if (sourceType === "file" && !file) {
      setError("Please choose an image file");
      return;
    }

    if (sourceType === "link" && !imageUrl.trim()) {
      setError("Please enter image link");
      return;
    }

    if (!routeChoice) {
      setError("Please select redirection route");
      return;
    }

    if (routeChoice === "other" && !redirectionUrl.trim()) {
      setError("Please enter external redirection URL");
      return;
    }
    if (routeChoice === "other") {
      const url = redirectionUrl.trim();
      if (!(url.startsWith("http") || url.startsWith("/"))) {
        setError("External URL must start with http or /");
        return;
      }
    }

    try {
      setUploading(true);
      await uploadBanner({
        file: sourceType === "file" ? file : null,
        imageUrl: sourceType === "link" ? imageUrl.trim() : "",
        bannerType: normalizeBannerType(bannerType),
        position: Number(bannerPosition),
        redirectionUrl: redirectionUrl.trim(),
      });
      setFile(null);
      setImageUrl("");
      setBannerType("");
      setBannerPosition("");
      setRedirectionUrl("");
      setRouteChoice("");
      setFileInputKey((k) => k + 1);
      await fetchBanners();
    } catch {
      setError("Failed to upload banner");
    } finally {
      setUploading(false);
    }
  };

  // Delete Banner
  const remove = async (id) => {
    try {
      await deleteBanner(id);
      await fetchBanners();
    } catch {
      setError("Failed to delete banner");
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setError("");

    if (!editBannerType.trim()) {
      setError("Please select banner type");
      return;
    }

    if (!editBannerPosition) {
      setError("Please select banner position");
      return;
    }

    if (!editRouteChoice) {
      setError("Please select redirection route");
      return;
    }

    if (editRouteChoice === "other" && !editRedirectionUrl.trim()) {
      setError("Please enter external redirection URL");
      return;
    }

    if (editRouteChoice === "other") {
      const url = editRedirectionUrl.trim();
      if (!(url.startsWith("http") || url.startsWith("/"))) {
        setError("External URL must start with http or /");
        return;
      }
    }

    if (editSourceType === "file" && !editFile) {
      setError("Please choose an image file");
      return;
    }

    if (editSourceType === "link" && !editImageUrl.trim()) {
      setError("Please enter image link");
      return;
    }

    try {
      setEditSaving(true);
      await updateBanner(editId, {
        file: editSourceType === "file" ? editFile : null,
        imageUrl: editSourceType === "link" ? editImageUrl.trim() : "",
        bannerType: normalizeBannerType(editBannerType),
        position: Number(editBannerPosition),
        redirectionUrl: editRedirectionUrl.trim(),
        isActive: editIsActive,
      });
      await fetchBanners();
      closeEdit();
    } catch {
      setError("Failed to update banner");
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Page Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="h5" fontWeight={600}>
          Banners
        </Typography>
      </Box>

      {/* Add Banner Form */}
      <Card>
        <CardContent>
          <Box component="form" onSubmit={add} sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "flex-start" }}>
            {/* Source Type Radio */}
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontSize: "0.75rem" }}>Image Source</FormLabel>
              <RadioGroup
                row
                name="sourceType"
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
              >
                <FormControlLabel value="file" control={<Radio size="small" />} label="Upload file" />
                <FormControlLabel value="link" control={<Radio size="small" />} label="Image link" />
              </RadioGroup>
            </FormControl>

            {/* File or URL input */}
            {sourceType === "file" ? (
              <Box>
                <input
                  key={fileInputKey}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  style={{ display: "block", marginTop: 8 }}
                />
              </Box>
            ) : (
              <TextField
                size="small"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/banner.jpg"
                label="Image URL"
                sx={{ minWidth: 260 }}
              />
            )}

            {/* Banner Type */}
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Banner Type</InputLabel>
              <Select
                value={bannerType}
                label="Banner Type"
                onChange={(e) => setBannerType(e.target.value)}
              >
                <MenuItem value="">Select banner type</MenuItem>
                {bannerTypeOptions.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Banner Position */}
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Position</InputLabel>
              <Select
                value={bannerPosition}
                label="Position"
                onChange={(e) => setBannerPosition(e.target.value)}
              >
                <MenuItem value="">Select position</MenuItem>
                {bannerPositionOptions.map((position) => (
                  <MenuItem key={position} value={position}>
                    Position {position}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Redirection Route */}
            <FormControl size="small" sx={{ minWidth: 260 }}>
              <InputLabel>Redirection Route</InputLabel>
              <Select
                value={routeChoice}
                label="Redirection Route"
                onChange={(e) => {
                  const val = e.target.value;
                  setRouteChoice(val);
                  if (val && val !== "other") setRedirectionUrl(val);
                  if (val === "other") setRedirectionUrl("");
                }}
              >
                <MenuItem value="">Select redirection route</MenuItem>
                {routeOptions.map((r) => (
                  <MenuItem key={r.value} value={r.value}>
                    {r.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* External URL input */}
            {routeChoice === "other" && (
              <TextField
                size="small"
                value={redirectionUrl}
                onChange={(e) => setRedirectionUrl(e.target.value)}
                placeholder="https://example.com or /custom-path"
                label="External URL"
                sx={{ minWidth: 260, flex: 1 }}
              />
            )}

            <Button
              type="submit"
              variant="contained"
              disabled={uploading}
              startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:upload" />}
              sx={{ alignSelf: "center" }}
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Filter Row */}
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Filter by Type</InputLabel>
          <Select
            value={filterType}
            label="Filter by Type"
            onChange={(e) => setFilterType(e.target.value)}
          >
            <MenuItem value="">All banner types</MenuItem>
            {bannerTypeOptions.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          onClick={() => setFilterType("")}
          startIcon={<Icon icon="mdi:filter-off" />}
        >
          Clear filter
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Banner Grid */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Typography color="text.secondary">No banners found</Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {items.map((b) => (
            <Grid item key={b._id} xs={12} sm={6} md={4} lg={3}>
              <Card sx={{ overflow: "hidden" }}>
                <Box
                  component="img"
                  src={b.image || b.imageUrl}
                  alt="banner"
                  sx={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
                />
                <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {formatBannerType(b.bannerType || b.type)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Position: {b.position || "-"}
                      </Typography>
                      {b.redirectionUrl && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        >
                          {b.redirectionUrl}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={() => openEdit(b)}>
                          <Icon icon="mdi:pencil" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => remove(b._id)}>
                          <Icon icon="mdi:delete" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={closeEdit} maxWidth="md" fullWidth>
        <Box component="form" onSubmit={saveEdit}>
          <DialogTitle>Edit Banner</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
              {/* Source Type Radio */}
              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ fontSize: "0.75rem" }}>Image Source</FormLabel>
                <RadioGroup
                  row
                  name="editSourceType"
                  value={editSourceType}
                  onChange={(e) => setEditSourceType(e.target.value)}
                >
                  <FormControlLabel value="keep" control={<Radio size="small" />} label="Keep existing image" />
                  <FormControlLabel value="file" control={<Radio size="small" />} label="Upload file" />
                  <FormControlLabel value="link" control={<Radio size="small" />} label="Image link" />
                </RadioGroup>
              </FormControl>

              {editSourceType === "file" && (
                <Box>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                    style={{ display: "block" }}
                  />
                </Box>
              )}

              {editSourceType === "link" && (
                <TextField
                  size="small"
                  type="url"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                  label="Image URL"
                  fullWidth
                />
              )}

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {/* Edit Banner Type */}
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Banner Type</InputLabel>
                  <Select
                    value={editBannerType}
                    label="Banner Type"
                    onChange={(e) => setEditBannerType(e.target.value)}
                  >
                    <MenuItem value="">Select banner type</MenuItem>
                    {bannerTypeOptions.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Edit Banner Position */}
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Position</InputLabel>
                  <Select
                    value={editBannerPosition}
                    label="Position"
                    onChange={(e) => setEditBannerPosition(e.target.value)}
                  >
                    <MenuItem value="">Select position</MenuItem>
                    {bannerPositionOptions.map((position) => (
                      <MenuItem key={position} value={position}>
                        Position {position}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Edit Redirection Route */}
              <FormControl size="small" sx={{ minWidth: 260 }}>
                <InputLabel>Redirection Route</InputLabel>
                <Select
                  value={editRouteChoice}
                  label="Redirection Route"
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditRouteChoice(val);
                    if (val && val !== "other") setEditRedirectionUrl(val);
                    if (val === "other") setEditRedirectionUrl("");
                  }}
                >
                  <MenuItem value="">Select redirection route</MenuItem>
                  {routeOptions.map((r) => (
                    <MenuItem key={r.value} value={r.value}>
                      {r.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {editRouteChoice === "other" && (
                <TextField
                  size="small"
                  value={editRedirectionUrl}
                  onChange={(e) => setEditRedirectionUrl(e.target.value)}
                  placeholder="https://example.com or /custom-path"
                  label="External URL"
                  fullWidth
                />
              )}

              {/* Active Toggle */}
              <FormControlLabel
                control={
                  <Switch
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    color="primary"
                  />
                }
                label="Active"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={closeEdit} variant="outlined">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={editSaving}
              startIcon={editSaving ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {editSaving ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
