import React, { useState } from "react";
import { Sparkles, Upload, AlertCircle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Campaign } from "../types";
import { api } from "../api/client";

interface Stage01BriefProps {
  onCampaignCreated: (campaign: Campaign) => void;
}

export const Stage01Brief: React.FC<Stage01BriefProps> = ({ onCampaignCreated }) => {
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [campaignObjective, setCampaignObjective] = useState("Product Launch");
  const [tone, setTone] = useState("Bold");
  const [cta, setCta] = useState("Fuel Your Session");
  const [verifiedClaims, setVerifiedClaims] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError("Please upload a PNG, JPEG, or WebP image");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be under 5MB");
        return;
      }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleLoadSample = async () => {
    setProductName("Apex Hydro-Fuel");
    setProductDescription(
      "Hypotonic electrolyte and mineral replenishment formula engineered with 1000mg sodium, 200mg potassium, 60mg magnesium malate, and pink Himalayan rock salt. Zero artificial sweeteners, zero sugar, zero food coloring. Dissolves instantly in cold water."
    );
    setTargetAudience("Competitive endurance athletes, CrossFit practitioners, and hybrid fitness athletes.");
    setCampaignObjective("Product Launch");
    setTone("Bold");
    setCta("Fuel Your Session");
    setVerifiedClaims(
      "Zero sugar & zero artificial additives\n1000mg sodium + 200mg potassium precision ratio\nInformed-Sport batch tested for athletic compliance"
    );
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!productName.trim()) {
      setError("Product Name is required");
      return;
    }
    if (!productDescription.trim() || productDescription.length < 10) {
      setError("Product Description must contain factual product information (at least 10 characters)");
      return;
    }
    if (!targetAudience.trim()) {
      setError("Target Audience is required");
      return;
    }
    if (!cta.trim()) {
      setError("Call to Action (CTA) is required");
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("productName", productName.trim());
      formData.append("productDescription", productDescription.trim());
      formData.append("targetAudience", targetAudience.trim());
      formData.append("campaignObjective", campaignObjective);
      formData.append("tone", tone);
      formData.append("cta", cta.trim());
      if (verifiedClaims.trim()) {
        formData.append("verifiedClaims", verifiedClaims.trim());
      }
      if (selectedFile) {
        formData.append("productImage", selectedFile);
      }

      const campaign = await api.createCampaign(formData);
      onCampaignCreated(campaign);
    } catch (err: any) {
      setError(err.message || "Failed to create campaign brief");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-neutral-800">
        <div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
            Start a Campaign
          </h1>
          <p className="text-neutral-400 text-sm mt-2 max-w-2xl leading-relaxed">
            Give BeastLife AI the product context it needs. We'll research the audience, develop creative directions,
            and build the campaign.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadSample}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-neutral-900 border border-neutral-700 text-neutral-200 hover:text-white hover:border-emerald-500/50 transition-all shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Load BeastLife Sample Brief</span>
        </button>
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-800/80 flex items-start gap-3 text-red-200 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Product Name & CTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-neutral-300 tracking-wider mb-2">
              Product Name <span className="text-emerald-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Hydro-Fuel"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-neutral-300 tracking-wider mb-2">
              Call to Action (CTA) <span className="text-emerald-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Fuel Your Session"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
            />
          </div>
        </div>

        {/* Product Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-mono font-semibold uppercase text-neutral-300 tracking-wider">
              Product Description (Factual) <span className="text-emerald-500">*</span>
            </label>
            <span className="text-[11px] text-neutral-400">Include active ingredients & specifications</span>
          </div>
          <textarea
            required
            rows={4}
            placeholder="Describe factual product features, key ingredients, formulation characteristics, and use cases..."
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm leading-relaxed"
          />
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-xs font-mono font-semibold uppercase text-neutral-300 tracking-wider mb-2">
            Target Audience <span className="text-emerald-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Competitive endurance runners, CrossFit athletes, and hybrid strength practitioners"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
          />
        </div>

        {/* Objective & Tone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-neutral-300 tracking-wider mb-2">
              Campaign Objective <span className="text-emerald-500">*</span>
            </label>
            <select
              value={campaignObjective}
              onChange={(e) => setCampaignObjective(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm cursor-pointer"
            >
              <option value="Product Launch">Product Launch</option>
              <option value="Awareness">Awareness</option>
              <option value="Consideration">Consideration</option>
              <option value="Conversion">Conversion</option>
              <option value="Retention">Retention</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-neutral-300 tracking-wider mb-2">
              Brand Tone <span className="text-emerald-500">*</span>
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm cursor-pointer"
            >
              <option value="Bold">Bold</option>
              <option value="Premium">Premium</option>
              <option value="Energetic">Energetic</option>
              <option value="Minimal">Minimal</option>
              <option value="Trustworthy">Trustworthy</option>
            </select>
          </div>
        </div>

        {/* Verified Claims */}
        <div className="p-4 rounded-xl bg-[#0e0e13] border border-neutral-800/80">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <label className="block text-xs font-mono font-semibold uppercase text-neutral-200 tracking-wider mb-1">
                Verified Claims (Optional)
              </label>
              <p className="text-xs text-neutral-400 mb-2.5">
                Only add claims that are verified and approved for advertising. BeastLife AI will not invent product
                benefits or clinical certifications.
              </p>
              <textarea
                rows={3}
                placeholder="One verified claim per line:&#10;Zero sugar & zero artificial additives&#10;1000mg sodium + 200mg potassium ratio&#10;Informed-Sport batch certified"
                value={verifiedClaims}
                onChange={(e) => setVerifiedClaims(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Reference Image Upload */}
        <div>
          <label className="block text-xs font-mono font-semibold uppercase text-neutral-300 tracking-wider mb-2">
            Product / Reference Image (Optional)
          </label>
          <div className="border-2 border-dashed border-neutral-800 hover:border-neutral-700 rounded-xl p-6 text-center bg-neutral-900/40 transition-colors cursor-pointer relative">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {filePreview ? (
              <div className="flex items-center justify-center gap-4">
                <img
                  src={filePreview}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-lg border border-neutral-700"
                />
                <div className="text-left">
                  <div className="text-sm font-semibold text-white">{selectedFile?.name}</div>
                  <div className="text-xs text-neutral-500">Click or drag to change image</div>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
                <div className="text-sm font-medium text-neutral-300">
                  Drop a product image here, or <span className="text-emerald-400 underline">browse</span>
                </div>
                <div className="text-xs text-neutral-500 mt-1">PNG, JPG, or WebP up to 5MB</div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-6 border-t border-neutral-800 flex items-center justify-between">
          <div className="text-xs text-neutral-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Claim safety protocol active: no unverified benefits invented.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl font-display font-bold text-sm bg-emerald-500 text-black hover:bg-emerald-400 active:scale-98 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Creating Brief...</span>
              </>
            ) : (
              <span>Research Campaign →</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
