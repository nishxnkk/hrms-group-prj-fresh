import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "../../components/ui/Table";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import { Fragment } from "react";
import GuardedModal from "../../components/ui/GuardedModal";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [form, setForm] = useState({
    title: "",
    location: "",
    experience: "",
    salary: "",
  });
  const [search, setSearch] = useState("");
  const [showApply, setShowApply] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicant, setApplicant] = useState({ name: "", email: "", coverLetter: "" });
  const [resumeFile, setResumeFile] = useState(null);
  const [resumePreview, setResumePreview] = useState(null);
  const applyFormRef = useRef(null);

  const [loading, setLoading] = useState(true);

  const fetchJobs = async (opts = {}) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/jobs`, { params: opts });
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setIsAdmin(user.role === 'Admin');
    }
    fetchJobs({ search });
  }, []);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      fetchJobs({ search });
    }, 350);

    return () => clearTimeout(t);
  }, [search]);

  const submitJob = async (e) => {
    e.preventDefault();
    await axios.post(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/jobs`, form);
    setForm({ title: "", location: "", experience: "", salary: "" });
    fetchJobs();
  };

  const openApply = (job) => {
    setSelectedJob(job);
    setShowApply(true);
  };

  const closeApply = () => {
    setShowApply(false);
    setSelectedJob(null);
    setApplicant({ name: "", email: "", coverLetter: "" });
    setResumeFile(null);
    setResumePreview(null);
  };

  const onResumeChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setResumeFile(f);
    try {
      const url = URL.createObjectURL(f);
      setResumePreview(url);
    } catch (e) {
      setResumePreview(null);
    }
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;
    const fd = new FormData();
    fd.append('name', applicant.name);
    fd.append('email', applicant.email);
    fd.append('coverLetter', applicant.coverLetter);
    if (resumeFile) fd.append('resume', resumeFile);

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/jobs/${selectedJob.id}/apply`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      closeApply();
      window.uiAlert?.('Application submitted');
    } catch (err) {
      console.error(err);
      window.uiAlert?.('Failed to submit application');
    }
  };

  // ✅ DELETE JOB
  const deleteJob = async (id) => {
    if (!isAdmin) return;
    const confirmDelete = await window.uiConfirm?.(
      "Are you sure you want to delete this job?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/jobs/${id}`);
      fetchJobs();
    } catch (err) {
      window.uiAlert?.("Failed to delete job");
    }
  };

  if (!jobs) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Recruitment</h1>
        <div className="ml-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs..."
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 dark:text-slate-100 rounded-lg focus:outline-none"
          />
        </div>
      </div>

      {/* Create Job */}
      {isAdmin && (
        <Card className="dark:bg-slate-900">
          <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-slate-100">Post a New Job</h2>
          <form onSubmit={submitJob}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-slate-100">Job Title</label>
                <input
                  placeholder="e.g. Senior Developer"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:text-slate-100 focus:ring-2 focus:ring-[#020839] focus:border-transparent dark:focus:ring-slate-600 dark:focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-slate-100">Location</label>
                <input
                  placeholder="e.g. Remote"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:text-slate-100 focus:ring-2 focus:ring-[#020839] focus:border-transparent dark:focus:ring-slate-600 outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-slate-100">Experience</label>
                <input
                  placeholder="e.g. 3-5 Years"
                  value={form.experience}
                  onChange={(e) => setForm({ ...form, experience: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:text-slate-100 focus:ring-2 focus:ring-[#020839] focus:border-transparent dark:focus:ring-slate-600 outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-slate-100">Salary Range</label>
                <input
                  placeholder="e.g. $80k - $120k"
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:text-slate-100 focus:ring-2 focus:ring-[#020839] focus:border-transparent dark:focus:ring-slate-600 outline-none transition-all"
                  required
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button type="submit">
                Create Job Posting
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Job List */}
      <div className="space-y-4 ">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Active Listings</h2>

        {loading ? (
          <Card className="p-0 overflow-hidden dark:bg-slate-900">
            <div className="p-4 border-b border-gray-200 bg-gray-50 dark:bg-slate-900 flex justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          </Card>
        ) : jobs.length === 0 ? (
          <Card className="dark:bg-slate-900">
            <EmptyState
              title="No active job listings"
              description="Get started by creating a new job position above."
            />
          </Card>
        ) : (
          <Table className="dark:bg-slate-900">
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Salary</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <tbody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium text-gray-900">{job.title}</TableCell>
                  <TableCell>{job.location}</TableCell>
                  <TableCell>{job.experience}</TableCell>
                  <TableCell>{job.salary}</TableCell>
                  <TableCell className="text-right">
                    {isAdmin ? (
                      <button
                        onClick={() => deleteJob(job.id)}
                        className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"
                      >
                        Delete
                      </button>
                    ) : (
                      <button
                        onClick={() => openApply(job)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm transition-colors"
                      >
                        Apply
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Apply Modal */}
      {showApply && selectedJob && (
        <GuardedModal
          onDiscard={closeApply}
          onSave={() => applyFormRef.current?.requestSubmit()}
          contentClassName="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6"
        >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Apply for {selectedJob.title}</h3>
              <button onClick={closeApply} className="text-gray-500">Close</button>
            </div>

            <form ref={applyFormRef} onSubmit={submitApplication} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required placeholder="Full name" value={applicant.name} onChange={(e) => setApplicant({ ...applicant, name: e.target.value })} className="px-3 py-2 border rounded" />
                <input required placeholder="Email" value={applicant.email} onChange={(e) => setApplicant({ ...applicant, email: e.target.value })} className="px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="text-sm font-medium">Resume (PDF/DOC)</label>
                <input type="file" accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={onResumeChange} className="block mt-2" />
                {resumePreview && (
                  <div className="mt-3 border p-2">
                    <iframe title="resume-preview" src={resumePreview} className="w-full h-64" />
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Cover Letter</label>
                <textarea value={applicant.coverLetter} onChange={(e) => setApplicant({ ...applicant, coverLetter: e.target.value })} className="w-full mt-2 border rounded p-2" rows={4} />
              </div>

              <div className="flex justify-end">
                <button type="submit" className="px-4 py-2 bg-[#020839] text-white rounded">Submit Application</button>
              </div>
            </form>
        </GuardedModal>
      )}
    </div>
  );
}
