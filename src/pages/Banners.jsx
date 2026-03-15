import { useEffect, useState } from "react";
import { listBanners, uploadBanner, deleteBanner } from "../services/api.js";

export default function Banners() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [sourceType, setSourceType] = useState("file");
  const [bannerType, setBannerType] = useState("");
  const [redirectionUrl, setRedirectionUrl] = useState("");
  const [filterType, setFilterType] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);

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

    if (!redirectionUrl.trim()) {
      setError("Please enter redirection URL");
      return;
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

        <input
          type="url"
          value={redirectionUrl}
          onChange={(e) => setRedirectionUrl(e.target.value)}
          placeholder="Redirection URL"
          required
          className="min-w-[260px] flex-1 rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
        />

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
                <button
                  onClick={() => remove(b._id)}
                  className="px-3 py-1 rounded bg-red-600 text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}




