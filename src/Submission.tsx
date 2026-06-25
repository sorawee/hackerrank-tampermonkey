import "./Submission.css";
import { z } from "zod";
import { useEffect, useState } from "react";
import Navbar from "./Navbar";

const SubmissionData = z.object({
  status: z.string(),
  language: z.string(),
  compile_message: z.string(),
  testcase_message: z.array(z.string()),
  codechecker_time: z.array(z.number()),
  slug: z.string(),
  updated_at: z.string(),
  code: z.string(),
});

type SubmissionData = z.infer<typeof SubmissionData>;

const Data = z.object({
  community: z.object({
    submissions: z.object({
      allSubmissions: z.record(
        z.string(), 
        SubmissionData,
      )
    })
  })
});

function extractInitialData(content: object): SubmissionData {
  const parsedContent = Data.parse(content);
  const submission = Object.values(
    parsedContent.community.submissions.allSubmissions
  )[0];
  if (submission === undefined) {
    throw new Error("cannot find submission in JSON");
  }
  return submission;
}

function Submission({ input }: { input: object }) {
  const [submission, setSubmission] = useState<SubmissionData | null>(null);

  useEffect(() => {
    setSubmission(extractInitialData(input));
  }, [input]);

  if (submission === null) {
    return (
      <div className="tamper-container">
        Loading...
      </div>
    );
  }

  return (
    <>
      <Navbar popLevel={3} />
      <div className="tamper-container">
        <h1>{submission.slug}</h1>

        <div className="submission-meta">
          <div>
            <strong>Status:</strong> {submission.status}
          </div>

          <div>
            <strong>Language:</strong> {submission.language}
          </div>

          <div>
            <strong>Updated:</strong>{" "}
            {new Date(
              submission.updated_at
            ).toLocaleString()}
          </div>
        </div>

        <textarea style={{ fontFamily: "monospace", width: "100%", marginBottom: "2ex" }} rows={10}>{
          submission.code
        }</textarea>

        <table className="submission-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Message</th>
              <th>Time (s)</th>
            </tr>
          </thead>

          <tbody>
            {submission.testcase_message.map(
              (message, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{message}</td>
                  <td>{submission.codechecker_time[index]?.toFixed(3) ?? "?"}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Submission;
