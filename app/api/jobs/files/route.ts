import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "job-files";
const MAX_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DOCUMENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "upload";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return fail("Authentication required.", 401);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, active")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) return fail(profileError.message, 500);
  if (!profile?.active || !["worker", "contractor"].includes(profile.role)) {
    return fail("Worker or contractor access required.", 403);
  }

  const form = await request.formData();
  const jobId = String(form.get("job_id") ?? "").trim();
  const kind = String(form.get("kind") ?? "").trim();
  const file = form.get("file");

  if (!jobId || !(file instanceof File)) return fail("job_id and a file are required.");
  if (file.size <= 0) return fail("The selected file is empty.");
  if (file.size > MAX_BYTES) return fail("Files must be 10 MB or smaller.");
  if (kind !== "photo" && kind !== "document") return fail("kind must be photo or document.");

  const allowed = kind === "photo" ? IMAGE_TYPES : DOCUMENT_TYPES;
  if (!allowed.has(file.type)) return fail(`Unsupported ${kind} file type.`);

  const assignmentQuery = supabase
    .from("job_assignments")
    .select("id, job_id, worker_id, contractor_id, status")
    .eq("job_id", jobId)
    .neq("status", "removed");

  const { data: assignments, error: assignmentError } = await assignmentQuery;
  if (assignmentError) return fail(assignmentError.message, 500);

  const assignment = (assignments ?? []).find((item) =>
    profile.role === "worker" ? item.worker_id === user.id : item.contractor_id === user.id
  );
  if (!assignment) return fail("You are not assigned to this Job.", 403);

  const admin = createAdminClient();
  const { data: buckets, error: bucketListError } = await admin.storage.listBuckets();
  if (bucketListError) return fail(`Storage is unavailable: ${bucketListError.message}`, 503);

  if (!buckets?.some((bucket) => bucket.id === BUCKET)) {
    const { error: createBucketError } = await admin.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: MAX_BYTES,
      allowedMimeTypes: Array.from(new Set([...IMAGE_TYPES, ...DOCUMENT_TYPES])),
    });
    if (createBucketError && !/already exists/i.test(createBucketError.message)) {
      return fail(`Unable to initialize private file storage: ${createBucketError.message}`, 503);
    }
  }

  const path = `jobs/${jobId}/${profile.role}/${user.id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) return fail(`File upload failed: ${uploadError.message}`, 500);

  if (kind === "photo") {
    const { data, error } = await supabase
      .from("job_photos")
      .insert({
        job_id: jobId,
        uploaded_by: user.id,
        photo_type: "work_performed",
        storage_path: `${BUCKET}/${path}`,
        caption: file.name,
      })
      .select("id, job_id, photo_type, storage_path, caption, created_at")
      .single();
    if (error || !data) {
      await admin.storage.from(BUCKET).remove([path]);
      return fail(error?.message ?? "Unable to save photo record.", 500);
    }
    return NextResponse.json({ photo: data }, { status: 201 });
  }

  const { data, error } = await supabase
    .from("job_documents")
    .insert({
      job_id: jobId,
      uploaded_by: user.id,
      document_type: "work_performed",
      storage_path: `${BUCKET}/${path}`,
      file_name: file.name,
    })
    .select("id, job_id, document_type, storage_path, file_name, created_at")
    .single();
  if (error || !data) {
    await admin.storage.from(BUCKET).remove([path]);
    return fail(error?.message ?? "Unable to save document record.", 500);
  }

  return NextResponse.json({ document: data }, { status: 201 });
}
