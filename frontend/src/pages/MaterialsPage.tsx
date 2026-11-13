import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { Material } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import {
  Upload,
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  BookOpen,
} from "lucide-react";

export const MaterialsPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [materialType, setMaterialType] = useState<string>("TEXTBOOK");
  const [customTitle, setCustomTitle] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Course Documents & Ingestion</h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload syllabi, textbooks, class notes, and past examination papers. Chunks are semantically vectorized for grounded retrieval.
        </p>
      </div>

      {/* Upload Box */}
      <Card className="border-dashed border-slate-700 bg-slate-900/40">
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-1/3">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Material Classification *
              </label>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="SYLLABUS">SYLLABUS (Topic Hierarchy & Units)</option>
                <option value="TEXTBOOK">TEXTBOOK (In-Depth Grounding Source)</option>
                <option value="NOTES">NOTES (Lecture Key Takeaways)</option>
                <option value="PAST_PAPER">PAST_PAPER (Questions & Marks)</option>
              </select>
            </div>

            <div className="w-full sm:w-1/3">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Display Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Chapter 4: Cell Division"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="w-full sm:w-1/3">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Select File (PDF, TXT, DOCX) *
              </label>
              <input
                type="file"
                required
                accept=".pdf,.txt,.docx,.md"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600/20 file:text-blue-300 hover:file:bg-blue-600/30 cursor-pointer"
              />
            </div>
          </div>

          {uploadError && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
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

      {/* Material List */}
      <div>
        <h2 className="text-lg font-bold text-slate-200 mb-4">Ingested Material Library</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : materials.length === 0 ? (
          <Card className="text-center py-10">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-300 font-medium">No Materials Uploaded</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload course documents above to extract topics and generate diagnostic tests.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {materials.map((mat) => (
              <Card key={mat.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-blue-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-slate-100 text-sm">{mat.title}</h4>
                      <Badge variant="outline">{mat.material_type}</Badge>
                      {getStatusBadge(mat.processing_status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                      <span>{mat.total_pages} page(s)</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        {mat.total_chunks} semantic chunks
                      </span>
                      <span>•</span>
                      <span>{(mat.file_size / 1024).toFixed(1)} KB</span>
                    </div>
                    {mat.error_message && (
                      <p className="text-xs text-amber-400/90 mt-1.5 flex items-center gap-1.5">
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
                    onClick={() => handleDelete(mat.id)}
                    className="text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
