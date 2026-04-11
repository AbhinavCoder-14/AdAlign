
import { createClient } from "@supabase/supabase-js";



export async function POST(req:Request){



}


const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // use service key, not anon key
);

const storage = multer.memoryStorage(); // no disk
const upload = multer({ storage });

app.post("/upload/pdf", upload.single("pdf"), async (req, res) => {
  const fileKey = `${Date.now()}-${req.file.originalname}`;

  const { error } = await supabase.storage
    .from("pdfs")
    .upload(fileKey, req.file.buffer, {
      contentType: "application/pdf",
    });

  if (error) return res.status(500).json({ error: error.message });

  await queue.add("file-ready", {
    fileKey,
    filename: req.file.originalname,
  });

  res.json({ status: "queued", fileKey });
});