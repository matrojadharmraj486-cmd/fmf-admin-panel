import { useEffect, useState } from "react";
import { listBanners, uploadBanner, deleteBanner, updateBanner } from "../services/api.js";

export default function Banners() {
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
  const [editRedirectionUrl, setEditRedirectionUrl] = useState("");
  const [editRouteChoice, setEditRouteChoice] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  const openEdit = (b) => {
    const redirect = b?.redirectionUrl || "";
    const matched = routeOptions.find((r) => r.value === redirect);
    setEditId(b?._id || b?.id || "");
    setEditBannerType(b?.bannerType || b?.type || "");
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
    setEditRedirectionUrl("");
    setEditRouteChoice("");
    setEditSourceType("keep");
    setEditIsActive(true);
  };
  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await listBanners(filterType ? { bannerType: filterType } : {});
      setItems(Array.isArray(res) ? res : res?.data || []);
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
      setError("Please enter banner type");
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
        bannerType: bannerType.trim(),
        redirectionUrl: redirectionUrl.trim(),
      });
      setFile(null);
      setImageUrl("");
      setBannerType("");
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

  // 🔥 Delete Banner
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
      setError("Please enter banner type");
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
        bannerType: editBannerType.trim(),
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
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Banners</h2>

      <form
        onSubmit={add}
        className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded shadow"
      >
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="sourceType"
              value="file"
              checked={sourceType === "file"}
              onChange={() => setSourceType("file")}
            />
            Upload file
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="sourceType"
              value="link"
              checked={sourceType === "link"}
              onChange={() => setSourceType("link")}
            />
            Image link
          </label>
        </div>

        {sourceType === "file" ? (
          <input
            key={fileInputKey}
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
          />
        ) : (
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/banner.jpg"
            className="min-w-[260px] flex-1 rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
          />
        )}

        <select
          value={bannerType}
          onChange={(e) => setBannerType(e.target.value)}
          className="min-w-[200px] rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
        >
          <option value="">Select banner type</option>
          <option value="type1">type1</option>
          <option value="type2">type2</option>
          <option value="type3">type3</option>
        </select>

        <select
          value={routeChoice}
          onChange={(e) => {
            const val = e.target.value;
            setRouteChoice(val);
            if (val && val !== "other") setRedirectionUrl(val);
            if (val === "other") setRedirectionUrl("");
          }}
          className="min-w-[260px] rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
        >
          <option value="">Select redirection route</option>
          {routeOptions.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        {routeChoice === "other" ? (
          <input
            type="text"
            value={redirectionUrl}
            onChange={(e) => setRedirectionUrl(e.target.value)}
            placeholder="https://example.com or /custom-path"
            className="min-w-[260px] flex-1 rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
          />
        ) : null}

        <button
          type="submit"
          disabled={uploading}
          className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-gray-700 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          placeholder="Filter by banner type"
          className="min-w-[220px] rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
        />
        <button
          type="button"
          onClick={() => setFilterType("")}
          className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          Clear filter
        </button>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500">No banners found</div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((b) => (
            <div
              key={b._id}
              className="rounded bg-white dark:bg-gray-800 shadow overflow-hidden"
            >
              <img
                src={b.image || b.imageUrl}
                alt="banner"
                className="w-full h-40 object-cover"
              />
              <div className="p-2 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  <div>{b.bannerType || b.type || "—"}</div>
                  {b.redirectionUrl ? (
                    <div className="truncate max-w-[180px]">
                      {b.redirectionUrl}
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(b)}
                    className="px-3 py-1 rounded bg-blue-600 text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(b._id)}
                    className="px-3 py-1 rounded bg-red-600 text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={saveEdit} className="bg-white dark:bg-gray-800 rounded-xl shadow w-full max-w-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-lg">Edit Banner</div>
              <button type="button" onClick={closeEdit} className="text-gray-500">Close</button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="editSourceType"
                  value="keep"
                  checked={editSourceType === "keep"}
                  onChange={() => setEditSourceType("keep")}
                />
                Keep existing image
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="editSourceType"
                  value="file"
                  checked={editSourceType === "file"}
                  onChange={() => setEditSourceType("file")}
                />
                Upload file
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="editSourceType"
                  value="link"
                  checked={editSourceType === "link"}
                  onChange={() => setEditSourceType("link")}
                />
                Image link
              </label>
            </div>

            {editSourceType === "file" ? (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
              />
            ) : editSourceType === "link" ? (
              <input
                type="url"
                value={editImageUrl}
                onChange={(e) => setEditImageUrl(e.target.value)}
                placeholder="https://example.com/banner.jpg"
                className="min-w-[260px] rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
              />
            ) : null}

            <select
              value={editBannerType}
              onChange={(e) => setEditBannerType(e.target.value)}
              className="min-w-[200px] rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
            >
              <option value="">Select banner type</option>
              <option value="type1">type1</option>
              <option value="type2">type2</option>
              <option value="type3">type3</option>
            </select>

            <select
              value={editRouteChoice}
              onChange={(e) => {
                const val = e.target.value;
                setEditRouteChoice(val);
                if (val && val !== "other") setEditRedirectionUrl(val);
                if (val === "other") setEditRedirectionUrl("");
              }}
              className="min-w-[260px] rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
            >
              <option value="">Select redirection route</option>
              {routeOptions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            {editRouteChoice === "other" ? (
              <input
                type="text"
                value={editRedirectionUrl}
                onChange={(e) => setEditRedirectionUrl(e.target.value)}
                placeholder="https://example.com or /custom-path"
                className="min-w-[260px] rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
              />
            ) : null}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
              />
              Active
            </label>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeEdit} className="px-4 py-2 rounded border border-gray-300 dark:border-gray-700">
                Cancel
              </button>
              <button type="submit" disabled={editSaving} className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-gray-700 disabled:opacity-60">
                {editSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

