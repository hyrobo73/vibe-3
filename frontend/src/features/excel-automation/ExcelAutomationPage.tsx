import { ChangeEvent, FormEvent, useState } from "react";
import { apiFormPost } from "../../shared/api/client";
import type { ExcelColumnsResponse, ExcelJob } from "../../shared/types/api";

export function ExcelAutomationPage() {
  const [mode, setMode] = useState<"split" | "merge">("split");
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [job, setJob] = useState<ExcelJob | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSplitFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSplitFile(file);
    setColumns([]);
    setSelectedColumn("");
    setJob(null);
    setMessage("");
    setError("");

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await apiFormPost<ExcelColumnsResponse>("/api/excel/columns", formData);
      setColumns(result.columns);
      setSelectedColumn(result.columns[0] ?? "");
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to read columns.");
    }
  }

  function handleMergeFilesChange(event: ChangeEvent<HTMLInputElement>) {
    setMergeFiles(Array.from(event.target.files ?? []));
    setJob(null);
    setMessage("");
    setError("");
  }

  async function handleSplitSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!splitFile || !selectedColumn) {
      setError("Select an xlsx file and split column.");
      return;
    }

    const formData = new FormData();
    formData.append("file", splitFile);
    formData.append("column_name", selectedColumn);
    await submitJob("/api/excel/split", formData, "Split file is ready.");
  }

  async function handleMergeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mergeFiles.length < 2) {
      setError("Select at least two xlsx files.");
      return;
    }

    const formData = new FormData();
    mergeFiles.forEach((file) => formData.append("files", file));
    await submitJob("/api/excel/merge", formData, "Merged file is ready.");
  }

  async function submitJob(path: string, formData: FormData, successMessage: string) {
    setLoading(true);
    setMessage("");
    setError("");
    setJob(null);

    try {
      const result = await apiFormPost<ExcelJob>(path, formData);
      setJob(result);
      setMessage(successMessage);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Excel processing failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="excel-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow dark">Excel Automation</p>
          <h2>Excel split and merge</h2>
        </div>
        <div className="view-actions">
          <button className={mode === "split" ? "active" : ""} type="button" onClick={() => setMode("split")}>
            Split
          </button>
          <button className={mode === "merge" ? "active" : ""} type="button" onClick={() => setMode("merge")}>
            Merge
          </button>
        </div>
      </div>

      {(message || error) && <div className={error ? "notice error" : "notice"}>{error || message}</div>}

      {mode === "split" ? (
        <form className="panel excel-form" onSubmit={handleSplitSubmit}>
          <div className="panel-title-row">
            <h3>Split by column</h3>
            <span>Result: ZIP</span>
          </div>
          <label>
            XLSX file
            <input accept=".xlsx" required type="file" onChange={handleSplitFileChange} />
          </label>
          <label>
            Split column
            <select required value={selectedColumn} onChange={(event) => setSelectedColumn(event.target.value)} disabled={columns.length === 0}>
              <option value="">Select column</option>
              {columns.map((column) => (
                <option value={column} key={column}>
                  {column}
                </option>
              ))}
            </select>
          </label>
          <button className="primary-button" type="submit" disabled={loading || !splitFile || !selectedColumn}>
            {loading ? "Processing..." : "Create split files"}
          </button>
        </form>
      ) : (
        <form className="panel excel-form" onSubmit={handleMergeSubmit}>
          <div className="panel-title-row">
            <h3>Merge files</h3>
            <span>Headers must match</span>
          </div>
          <label className="wide-field">
            XLSX files
            <input accept=".xlsx" multiple required type="file" onChange={handleMergeFilesChange} />
          </label>
          <button className="primary-button" type="submit" disabled={loading || mergeFiles.length < 2}>
            {loading ? "Processing..." : "Create merged file"}
          </button>
        </form>
      )}

      <div className="panel excel-result-panel">
        <div className="panel-title-row">
          <h3>Processing result</h3>
          {job && <span>Job #{job.id}</span>}
        </div>
        {job ? (
          <div className="excel-result">
            <div>
              <strong>{job.job_type.toUpperCase()}</strong>
              <span>{job.status}</span>
            </div>
            {job.error_message && <p>{job.error_message}</p>}
            {job.download_url && (
              <a className="primary-button download-button" href={job.download_url}>
                Download result
              </a>
            )}
          </div>
        ) : (
          <p className="empty-cell">Upload xlsx files and run a job to download the result.</p>
        )}
      </div>
    </section>
  );
}
