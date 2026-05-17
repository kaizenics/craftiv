"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, ShieldCheck, Upload } from "@/components/ui/icons";

import { Button } from "@/components/ui/button";

type Atsi = {
	section: string;
	score: number;
	notes: string;
};

type Improvement = {
	title: string;
	why: string;
	example: string;
};

type AtsReport = {
	overallScore: number;
	atsCompatibility: "Low" | "Medium" | "High" | string;
	summary: string;
	strengths: string[];
	missingKeywords: string[];
	topActions: string[];
	rewrittenSummary: string;
	sectionScores: Atsi[];
	improvements: Improvement[];
};

const MAX_SIZE_MB = 10;

function readStoredAtsJobDescription(): string {
	if (typeof window === "undefined") return "";
	const raw = localStorage.getItem("atsJobDescriptionDraft");
	if (!raw) return "";
	try {
		const parsed = JSON.parse(raw) as { jobDescription?: string };
		return parsed.jobDescription?.trim() || "";
	} catch {
		return "";
	}
}

export default function AtsCheckerPage() {
	const [file, setFile] = useState<File | null>(null);
	const [jobDescription, setJobDescription] = useState(readStoredAtsJobDescription);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [report, setReport] = useState<AtsReport | null>(null);

	const isInvalidType = useMemo(() => {
		if (!file) return false;
		const name = file.name.toLowerCase();
		return !name.endsWith(".pdf") && !name.endsWith(".docx");
	}, [file]);

	const isInvalidSize = useMemo(() => {
		if (!file) return false;
		return file.size > MAX_SIZE_MB * 1024 * 1024;
	}, [file]);

	const canAnalyze = !!file && !isInvalidType && !isInvalidSize && !isAnalyzing;

	const handleAnalyze = async () => {
		if (!file || !canAnalyze) return;

		setError(null);
		setReport(null);

		try {
			setIsAnalyzing(true);

			const formData = new FormData();
			formData.append("file", file);
			formData.append("requestId", crypto.randomUUID());
			if (jobDescription.trim()) {
				formData.append("jobDescription", jobDescription.trim());
			}

			const response = await fetch("/api/ats-check", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const body = await response.json();
				throw new Error(body.message || body.error || "Failed to analyze resume");
			}

			const body = await response.json();
			setReport(body.report as AtsReport);
		} catch (e: any) {
			setError(e.message || "Something went wrong while analyzing your resume.");
		} finally {
			setIsAnalyzing(false);
		}
	};

	return (
		<div className="space-y-8">
			<div>
				<h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">ATS Checker</h1>
				<p className="mt-1 text-muted-foreground">
					Upload your resume and get AI feedback to improve ATS match and recruiter impact.
				</p>
			</div>

			<div className="rounded-xl bg-card">
				<div className="space-y-4">
					<label
						htmlFor="ats-upload"
						className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-8 text-center hover:bg-muted/5"
					>
						<Upload className="h-8 w-8 text-primary" />
						<div>
							<p className="font-medium text-foreground">Upload resume (PDF or DOCX)</p>
							<p className="text-sm text-muted-foreground">Max file size {MAX_SIZE_MB}MB</p>
						</div>
					</label>

					<div className="space-y-2">
						<label htmlFor="job-description" className="text-sm font-medium text-foreground">
							Target Job Description (optional, improves keyword accuracy)
						</label>
						<textarea
							id="job-description"
							value={jobDescription}
							onChange={(e) => setJobDescription(e.target.value)}
							placeholder="Paste the job description here for more accurate ATS matching..."
							rows={5}
							className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-0 placeholder:text-muted-foreground focus:border-amber-400"
						/>
					</div>

					<input
						id="ats-upload"
						type="file"
						accept=".pdf,.docx"
						className="hidden"
						onChange={(e) => {
							const nextFile = e.target.files?.[0] ?? null;
							setFile(nextFile);
							setReport(null);
							setError(null);
						}}
					/>

					{file && (
						<div className="rounded-lg border border-border px-3 py-2 text-sm">
							<span className="font-medium text-foreground">Selected:</span> {file.name}
						</div>
					)}

					{isInvalidType && (
						<p className="text-sm text-red-600">Only PDF and DOCX files are supported.</p>
					)}

					{isInvalidSize && (
						<p className="text-sm text-red-600">File size must be under {MAX_SIZE_MB}MB.</p>
					)}

					<div className="flex flex-wrap items-center gap-2">
						<Button
							onClick={handleAnalyze}
							disabled={!canAnalyze}
							className="w-full sm:w-auto"
						>
							{isAnalyzing ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Analyzing Resume...
								</>
							) : (
								"Run ATS Check"
							)}
						</Button>
					</div>
					<p className="text-xs text-muted-foreground">
						ATS Checker uses 1 credit &middot;{" "}
						<Link href="/pricing" className="text-foreground underline underline-offset-2">
							Get more credits
						</Link>
					</p>

					{error && (
						<div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
							<AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
							<span>{error}</span>
						</div>
					)}
				</div>
			</div>

			{report && (
				<div className="space-y-6">
					<div className="grid gap-4 sm:grid-cols-3">
						<div className="rounded-xl border border-border bg-card p-4">
							<p className="text-sm text-muted-foreground">Overall ATS Score</p>
							<p className="mt-1 text-3xl font-bold text-foreground">{report.overallScore}/100</p>
						</div>

						<div className="rounded-xl border border-border bg-card p-4">
							<p className="text-sm text-muted-foreground">Compatibility</p>
							<p className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
								<ShieldCheck className="h-4 w-4" />
								{report.atsCompatibility}
							</p>
						</div>

						<div className="rounded-xl border border-border bg-card p-4">
							<p className="text-sm text-muted-foreground">Top Priority</p>
							<p className="mt-1 text-sm text-foreground">{report.topActions?.[0] || "Improve work impact bullets"}</p>
						</div>
					</div>

					<p className="text-xs text-muted-foreground">
						Score is computed using a deterministic ATS rubric and keyword matching.
					</p>

					<div className="rounded-xl border border-border bg-card p-5">
						<h2 className="text-lg font-semibold text-foreground">Recruiter Summary</h2>
						<p className="mt-2 text-sm text-muted-foreground">{report.summary}</p>
					</div>

					<div className="grid gap-4 lg:grid-cols-2">
						<div className="rounded-xl border border-border bg-card p-5">
							<h3 className="text-base font-semibold text-foreground">Strengths</h3>
							<ul className="mt-3 space-y-2 text-sm text-muted-foreground">
								{(report.strengths || []).map((item, idx) => (
									<li key={`${item}-${idx}`} className="flex gap-2">
										<span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
										<span>{item}</span>
									</li>
								))}
							</ul>
						</div>

						<div className="rounded-xl border border-border bg-card p-5">
							<h3 className="text-base font-semibold text-foreground">Missing Keywords</h3>
							<div className="mt-3 flex flex-wrap gap-2">
								{(report.missingKeywords || []).map((keyword, idx) => (
									<span
										key={`${keyword}-${idx}`}
										className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-700"
									>
										{keyword}
									</span>
								))}
							</div>
						</div>
					</div>

					<div className="rounded-xl border border-border bg-card p-5">
						<h3 className="text-base font-semibold text-foreground">Section Scores</h3>
						<div className="mt-3 space-y-3">
							{(report.sectionScores || []).map((s, idx) => (
								<div key={`${s.section}-${idx}`} className="rounded-lg border border-border p-3">
									<div className="flex items-center justify-between">
										<p className="font-medium text-foreground">{s.section}</p>
										<p className="text-sm font-semibold text-foreground">{s.score}/100</p>
									</div>
									<p className="mt-1 text-sm text-muted-foreground">{s.notes}</p>
								</div>
							))}
						</div>
					</div>

					<div className="rounded-xl border border-border bg-card p-5">
						<h3 className="text-base font-semibold text-foreground">How To Improve</h3>
						<div className="mt-3 space-y-3">
							{(report.improvements || []).map((item, idx) => (
								<div key={`${item.title}-${idx}`} className="rounded-lg border border-border p-3">
									<p className="font-medium text-foreground">{item.title}</p>
									<p className="mt-1 text-sm text-muted-foreground">{item.why}</p>
									<p className="mt-2 rounded-md bg-muted/40 px-2 py-2 text-sm text-foreground">
										Example: {item.example}
									</p>
								</div>
							))}
						</div>
					</div>

					<div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
						<h3 className="text-base font-semibold text-foreground">Improved Summary Suggestion</h3>
						<p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{report.rewrittenSummary}</p>
					</div>
				</div>
			)}
		</div>
	);
}
