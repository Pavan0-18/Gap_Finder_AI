import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { Material } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import {
  Upload,
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  BookOpen,
  Search,
  Eye,
  Download,
  Sparkles,
} from "lucide-react";

export const MaterialsPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [materialType, setMaterialType] = useState<string>("TEXTBOOK");
  const [customTitle, setCustomTitle] = useState("");
  const [materialLevel, setMaterialLevel] = useState<string>("Intermediate");
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  // Preview Modal
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  const fetchMaterials = async () => {
    if (!subjectId) return;
    try {
      const res = await api.get(`/subjects/${subjectId}/materials`);
      setMaterials(res.data);
    } catch (err) {
      console.error("Failed to load materials", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [subjectId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !subjectId) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("material_type", materialType);
    if (customTitle.trim()) {
      formData.append("title", customTitle.trim());
    }

    try {
      await api.post(`/subjects/${subjectId}/materials`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSelectedFile(null);
      setCustomTitle("");
      await fetchMaterials();
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || "Upload failed. Verify file format and size.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm("Are you sure you want to delete this document? Associated chunks will be removed.")) return;
    try {
      await api.delete(`/materials/${materialId}`);
      await fetchMaterials();
    } catch (err) {
      console.error("Failed to delete material", err);
    }
  };

  const handleDownloadSnippet = (mat: Material) => {
    const text = `# ${mat.title}\nType: ${mat.material_type}\nPages: ${mat.total_pages}\nChunks: ${mat.total_chunks}\nCreated: ${mat.created_at}\n\n[Ingested into GapFinder AI Knowledge Base]`;
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${mat.title.replace(/[^a-z0-9]/gi, "_")}_summary.md`;
    link.click();
  };

  const getStatusBadge = (status: Material["processing_status"]) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "PROCESSING":
        return <Badge variant="info">Processing...</Badge>;
      case "PARTIALLY_COMPLETED":
        return <Badge variant="warning">OCR Warning</Badge>;
      case "FAILED":
        return <Badge variant="danger">Failed</Badge>;
      default:
        return <Badge variant="default">Pending</Badge>;
    }
  };

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "ALL" || m.material_type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 animate-fade-in py-2">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Course Documents & Ingestion</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload syllabi, textbooks, class notes, and past examination papers. Chunks are semantically vectorized for grounded retrieval.
        </p>
      </div>

      {/* Adaptive Study Material Recommendation Banner */}
      <Card className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/25">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Personalized Material Recommendations
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Diagnostic performance indicates high priority review for Chapter 4 & 5 textbook chapters. Grounding and vector similarity prioritize these sources in your quiz generation and AI tutor sessions.
            </p>
          </div>
        </div>
      </Card>

      {/* Upload Box */}
      <Card className="border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 p-6">
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Classification *
              </label>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="SYLLABUS">SYLLABUS (Topics & Units)</option>
                <option value="TEXTBOOK">TEXTBOOK (Grounding Source)</option>
                <option value="NOTES">NOTES (Lecture Notes)</option>
                <option value="PAST_PAPER">PAST_PAPER (Questions & Marks)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Target Level
              </label>
              <select
                value={materialLevel}
                onChange={(e) => setMaterialLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="Beginner">Beginner (Foundational)</option>
                <option value="Intermediate">Intermediate (Core Curriculum)</option>
                <option value="Advanced">Advanced (High-Yield / Deep)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Display Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Chapter 4: Cell Division"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Select File (PDF, TXT, DOCX) *
              </label>
              <input
                type="file"
                required
                accept=".pdf,.txt,.docx,.md"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500/20 file:text-amber-700 dark:file:text-amber-300 hover:file:bg-amber-500/30 cursor-pointer"
              />
            </div>
          </div>

          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={!selectedFile}
              isLoading={isUploading}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Ingest & Chunk Document
            </Button>
          </div>
        </form>
      </Card>

      {/* Material Library & Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Ingested Material Library ({filteredMaterials.length})
          </h2>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Classification Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Types</option>
              <option value="TEXTBOOK">Textbooks</option>
              <option value="SYLLABUS">Syllabi</option>
              <option value="NOTES">Notes</option>
              <option value="PAST_PAPER">Past Papers</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredMaterials.length === 0 ? (
          <Card className="text-center py-10">
            <BookOpen className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">No Materials Found</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload course documents above or adjust your search filter.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredMaterials.map((mat) => (
              <Card key={mat.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 border border-slate-200 dark:border-slate-700">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{mat.title}</h4>
                      <Badge variant="outline">{mat.material_type}</Badge>
                      <Badge variant="amber">{materialLevel}</Badge>
                      {getStatusBadge(mat.processing_status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span>{mat.total_pages} page(s)</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-amber-500" />
                        {mat.total_chunks} semantic chunks
                      </span>
                      <span>•</span>
                      <span>{(mat.file_size / 1024).toFixed(1)} KB</span>
                    </div>
                    {mat.error_message && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {mat.error_message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewMaterial(mat)}
                    title="Preview Document Details"
                    className="text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadSnippet(mat)}
                    title="Download Summary & Metadata"
                    className="text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(mat.id)}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewMaterial}
        onClose={() => setPreviewMaterial(null)}
        title={previewMaterial ? `Document Preview: ${previewMaterial.title}` : "Preview"}
      >
        {previewMaterial && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800">
              <div>
                <span className="text-slate-400 block font-medium">Material Type:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{previewMaterial.material_type}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Processing Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{previewMaterial.processing_status}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Pages Extracted:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{previewMaterial.total_pages} Pages</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Semantic Chunks:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{previewMaterial.total_chunks} Chunks (1536-dim)</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-700 dark:text-slate-300 block">Content Hash & Security:</span>
              <p className="font-mono text-[11px] text-slate-500 break-all bg-slate-100 dark:bg-slate-900 p-2 rounded-lg">
                {previewMaterial.content_hash}
              </p>
            </div>

            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
              All extracted passages from this material have been validated against duplicate uploads, filtered for mathematical equations, and indexed for similarity retrieval.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setPreviewMaterial(null)}>
                Close Preview
              </Button>
              <Button variant="primary" size="sm" onClick={() => handleDownloadSnippet(previewMaterial)}>
                <Download className="w-3.5 h-3.5 mr-1" />
                Download Metadata
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
