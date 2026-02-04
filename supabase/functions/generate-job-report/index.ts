import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { jobId } = await req.json();

    if (!jobId) {
      return new Response(JSON.stringify({ error: "Job ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch job with all related data
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(`
        *,
        clients (name, email, phone, address),
        job_checklists (*),
        job_photos (*),
        job_signatures (*)
      `)
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    type JobChecklistItem = { completed: boolean; item: string };
    type JobPhoto = { file_url: string };
    type JobSignature = { file_url: string; signer_name?: string | null; signed_at?: string | null };
    type JobData = {
      job_number: string;
      title: string;
      status: string;
      scheduled_date?: string | null;
      address?: string | null;
      description?: string | null;
      completion_notes?: string | null;
      clients?: { name?: string | null; phone?: string | null; email?: string | null; address?: string | null };
      job_checklists?: JobChecklistItem[];
      job_photos?: JobPhoto[];
      job_signatures?: JobSignature[];
    };

    const jobData = job as JobData;
    const completedItems = jobData.job_checklists?.filter((item) => item.completed) || [];
    const totalItems = jobData.job_checklists?.length || 0;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <title>Report Lavoro - ${jobData.job_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.6; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #22c55e; padding-bottom: 20px; }
        .logo { font-size: 28px; font-weight: bold; color: #22c55e; }
        .logo-sub { font-size: 12px; color: #666; }
        .job-number { font-size: 14px; color: #666; }
        .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 16px; font-weight: bold; color: #22c55e; margin-bottom: 15px; border-bottom: 1px solid #e5e5e5; padding-bottom: 5px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .info-item { margin-bottom: 10px; }
        .info-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .info-value { font-size: 14px; font-weight: 500; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .status-completed { background: #dcfce7; color: #16a34a; }
        .status-in_progress { background: #dbeafe; color: #2563eb; }
        .checklist { list-style: none; }
        .checklist li { padding: 8px 0; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; gap: 10px; }
        .check-icon { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; }
        .check-done { background: #22c55e; color: white; }
        .check-pending { background: #e5e5e5; color: #999; }
        .photos-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .photo { width: 100%; height: 150px; object-fit: cover; border-radius: 8px; }
        .signature-container { text-align: center; margin-top: 20px; }
        .signature { max-width: 300px; max-height: 150px; border: 1px solid #e5e5e5; border-radius: 8px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; }
        .progress-bar { background: #e5e5e5; height: 20px; border-radius: 10px; overflow: hidden; }
        .progress-fill { background: #22c55e; height: 100%; transition: width 0.3s; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">DOIT</div>
          <div class="logo-sub">Gestione Lavori</div>
        </div>
        <div style="text-align: right;">
          <div class="job-number">${jobData.job_number}</div>
          <div class="status-badge status-${jobData.status}">${
            jobData.status === 'completed' ? 'Completato' : 
            jobData.status === 'in_progress' ? 'In Corso' : 
            jobData.status
          }</div>
        </div>
      </div>

      <h1 class="title">${jobData.title}</h1>
      
      <div class="section">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Cliente</div>
            <div class="info-value">${jobData.clients?.name || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Data</div>
            <div class="info-value">${jobData.scheduled_date ? new Date(jobData.scheduled_date).toLocaleDateString('it-IT') : '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Indirizzo</div>
            <div class="info-value">${jobData.address || jobData.clients?.address || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Contatto</div>
            <div class="info-value">${jobData.clients?.phone || jobData.clients?.email || '-'}</div>
          </div>
        </div>
      </div>

      ${jobData.description ? `
      <div class="section">
        <div class="section-title">Descrizione Lavoro</div>
        <p>${jobData.description}</p>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Avanzamento (${completedItems.length}/${totalItems})</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${totalItems > 0 ? (completedItems.length / totalItems) * 100 : 0}%"></div>
        </div>
        ${totalItems > 0 ? `
        <ul class="checklist" style="margin-top: 15px;">
          ${jobData.job_checklists?.map((item) => `
            <li>
              <span class="check-icon ${item.completed ? 'check-done' : 'check-pending'}">${item.completed ? '✓' : ''}</span>
              <span>${item.item}</span>
            </li>
          `).join('')}
        </ul>
        ` : '<p style="color: #999;">Nessuna attività in checklist</p>'}
      </div>

      ${jobData.job_photos?.length > 0 ? `
      <div class="section">
        <div class="section-title">Documentazione Fotografica (${jobData.job_photos.length})</div>
        <div class="photos-grid">
          ${jobData.job_photos.slice(0, 9).map((photo) => `
            <img src="${photo.file_url}" alt="Foto lavoro" class="photo" />
          `).join('')}
        </div>
      </div>
      ` : ''}

      ${jobData.job_signatures?.length > 0 ? `
      <div class="section">
        <div class="section-title">Firma Cliente</div>
        <div class="signature-container">
          <img src="${jobData.job_signatures[0].file_url}" alt="Firma cliente" class="signature" />
          ${jobData.job_signatures[0].signer_name ? `<p style="margin-top: 10px;">${jobData.job_signatures[0].signer_name}</p>` : ''}
          <p style="font-size: 12px; color: #999;">${jobData.job_signatures[0].signed_at ? new Date(jobData.job_signatures[0].signed_at).toLocaleDateString('it-IT') : ''}</p>
        </div>
      </div>
      ` : ''}

      ${jobData.completion_notes ? `
      <div class="section">
        <div class="section-title">Note di Completamento</div>
        <p>${jobData.completion_notes}</p>
      </div>
      ` : ''}

      <div class="footer">
        <p>Report generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}</p>
        <p>DOIT - Gestione Lavori</p>
      </div>
    </body>
    </html>
    `;

    // Return HTML for now (can be converted to PDF with a service)
    return new Response(
      JSON.stringify({
        success: true,
        html: htmlContent,
        job: {
          job_number: job.job_number,
          title: job.title,
          client_name: job.clients?.name,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating report:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
